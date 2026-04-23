from fastapi import APIRouter, Depends, Request, Response, Form
from sqlalchemy.orm import Session
import database, models
from datetime import datetime, timedelta
import os
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

router = APIRouter(prefix="/webhook/twilio", tags=["twilio"])


def _send_sms(client, to: str, body: str) -> bool:
    try:
        client.messages.create(body=body, from_=TWILIO_PHONE_NUMBER, to=to)
        return True
    except Exception as e:
        print(f"SMS send error to {to}: {e}")
        return False


def _log_alert(db: Session, user_id: int, checkin_id: int, alert_type: str,
               contact_name: str, contact_phone: str, message_body: str, success: bool):
    log = models.AlertLog(
        user_id=user_id,
        checkin_id=checkin_id,
        alert_type=alert_type,
        contact_name=contact_name,
        contact_phone=contact_phone,
        message_body=message_body,
        success=success
    )
    db.add(log)
    db.commit()


@router.post("/")
async def twilio_webhook(request: Request, db: Session = Depends(database.get_db)):
    form_data = await request.form()
    from_number = form_data.get("From", "")
    body = form_data.get("Body", "").strip().upper()

    from sqlalchemy import func
    from_number_clean = from_number.replace(" ", "")

    # Search for an active check-in where the sender is either the user or their emergency contact
    checkin = db.query(models.CheckInTrack).join(models.User).filter(
        (func.replace(models.User.phone_number, " ", "") == from_number_clean) |
        (func.replace(models.User.emergency_contact_phone, " ", "") == from_number_clean) |
        (func.replace(models.User.emergency_contact_phone_2, " ", "") == from_number_clean) |
        (func.replace(models.User.emergency_contact_phone_3, " ", "") == from_number_clean)
    ).filter(
        models.CheckInTrack.status.notin_(["completed", "missed", "emergency_acknowledged"])
    ).order_by(models.CheckInTrack.scheduled_for.desc()).first()

    if checkin:
        user = checkin.user # SQLAlchemy join gives access to user
        if body in ("YES", "Y"):
            previous_status = checkin.status
            checkin.status = "completed"
            checkin.responded_at = datetime.utcnow()
            db.commit()
            
            # Identify who replied
            is_user_reply = from_number_clean == (user.phone_number or "").replace(" ", "")
            
            # Send celebration emoji only if the USER themselves replied
            if is_user_reply and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and user.phone_number:
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                _send_sms(client, str(user.phone_number).replace(" ", ""), "🥳")
            
            # If an emergency contact replied, log it specifically
            if not is_user_reply:
                _log_alert(db, user.id, checkin.id, "emergency_resolved_by_contact", 
                           "Emergency Contact", from_number, "Emergency contact confirmed safety via SMS.", True)

                # If the check-in was already escalated, send a False Alarm notice to emergency contact
                escalated_statuses = {
                    "escalated_1_sms", "escalated_1_voice", 
                    "escalated_2_sms", "escalated_2_voice",
                    "escalated_3_sms", "escalated_3_voice"
                }
                if previous_status in escalated_statuses and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
                    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                    msg = (
                        f"UPDATE: {user.name} has just replied to their r u good? check-in "
                        f"and is safe. The previous alert was a false alarm."
                    )
                    for contact in [
                        (user.emergency_contact_phone, user.emergency_contact_name),
                        (user.emergency_contact_phone_2, user.emergency_contact_name_2),
                        (user.emergency_contact_phone_3, user.emergency_contact_name_3)
                    ]:
                        if contact[0]:
                            _send_sms(client, str(contact[0]).replace(" ", ""), msg)
                            _log_alert(db, user.id, checkin.id, "false_alarm_resolution", contact[1] or "Contact", contact[0], msg, True)

        elif body in ("NO", "N"):
            # Immediately escalate to all contacts
            checkin.status = "missed"
            checkin.responded_at = datetime.utcnow()
            db.commit()

            if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                
                # Notify the user
                if user.phone_number:
                    _send_sms(client, str(user.phone_number).replace(" ", ""), "We are contacting ALL your emergency contacts now..")

                # Notify all contacts
                msg = f"URGENT: {user.name} just replied 'NO' to their r u good? safety check-in. Please check on them immediately."
                
                contacts = [
                    (user.emergency_contact_phone, user.emergency_contact_name),
                    (user.emergency_contact_phone_2, user.emergency_contact_name_2),
                    (user.emergency_contact_phone_3, user.emergency_contact_name_3),
                ]
                
                for phone, name in contacts:
                    if phone:
                        phone_clean = str(phone).replace(" ", "")
                        ok = _send_sms(client, phone_clean, msg)
                        _log_alert(db, user.id, checkin.id, "emergency_no_all", name or "Contact", phone_clean, msg, ok)

    # Return empty TwiML so Twilio doesn't retry
    return Response(content="<?xml version='1.0' encoding='UTF-8'?><Response></Response>",
                    media_type="application/xml")


@router.post("/voice/emergency")
async def twilio_voice_emergency(request: Request):
    """
    Twilio calls this endpoint when the emergency contact picks up.
    Plays an urgent alert and asks them to press 1 to acknowledge.
    """
    user_id = request.query_params.get("user_id", "")
    checkin_id = request.query_params.get("checkin_id", "")

    base_url = os.getenv("APP_BASE_URL", "https://orca-app-8rqa7.ondigitalocean.app/api")
    
    response = VoiceResponse()
    gather = response.gather(
        num_digits=1,
        action=f"{base_url}/webhook/twilio/gather/emergency?user_id={user_id}&checkin_id={checkin_id}",
        method="POST",
        timeout=10
    )
    gather.say(
        "URGENT. This is an automated alert from the r u good? safety system. "
        "The person who listed you as their emergency contact has missed all check-in attempts "
        "and may be in danger. "
        "Please press 1 to confirm you have received this message and are taking action."
    )

    # If they don't press anything
    response.say("No response received. Please check on your contact immediately. Goodbye.")

    return Response(content=str(response), media_type="application/xml")


@router.post("/gather/emergency")
async def twilio_gather_emergency(request: Request, db: Session = Depends(database.get_db)):
    """
    Handles the digit pressed by the emergency contact during the voice call.
    """
    form_data = await request.form()
    digits = form_data.get("Digits", "")

    user_id = request.query_params.get("user_id")
    checkin_id = request.query_params.get("checkin_id")

    response = VoiceResponse()

    if not user_id or not checkin_id:
        response.say("Sorry, an error occurred. Goodbye.")
        return Response(content=str(response), media_type="application/xml")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    checkin = db.query(models.CheckInTrack).filter(models.CheckInTrack.id == int(checkin_id)).first()

    if not user or not checkin:
        response.say("Sorry, we could not find the associated record. Goodbye.")
        return Response(content=str(response), media_type="application/xml")

    if digits == "1":
        # Emergency contact acknowledged
        checkin.status = "emergency_acknowledged"
        checkin.responded_at = datetime.utcnow()
        db.commit()

        contact_name = user.emergency_contact_name or "Emergency Contact"
        _log_alert(db, user.id, checkin.id, "emergency_contact_acknowledged",
                   contact_name, user.emergency_contact_phone or "", 
                   "Emergency contact acknowledged via voice call.", True)

        response.say(
            "Thank you for confirming. Please check on them as soon as possible. "
            "We appreciate your response. Goodbye."
        )
    else:
        response.say("Invalid input. Please check on your contact immediately. Goodbye.")

    return Response(content=str(response), media_type="application/xml")


@router.post("/voice")
async def twilio_voice(request: Request):
    """
    Twilio requests this endpoint when a voice call connects.
    We return TwiML instructing Twilio to speak and gather digits.
    """
    form_data = await request.form()
    to_number = form_data.get("To", "")
    
    # We can pass the user_id or checkin_id as query params when initiating the call
    user_id = request.query_params.get("user_id", "")
    checkin_id = request.query_params.get("checkin_id", "")

    base_url = os.getenv("APP_BASE_URL", "https://orca-app-8rqa7.ondigitalocean.app/api")

    response = VoiceResponse()
    
    gather = response.gather(
        num_digits=1,
        action=f"{base_url}/webhook/twilio/gather?user_id={user_id}&checkin_id={checkin_id}",
        method="POST",
        timeout=10
    )
    gather.say("Hello. This is the r u good? AI safety check-in. "
               "If you are safe, please press 1. "
               "If you need emergency assistance, please press 2.")
    
    # If the user doesn't press anything or the gather times out:
    response.say("We did not receive any input. Goodbye.")

    return Response(content=str(response), media_type="application/xml")


@router.post("/gather")
async def twilio_gather(request: Request, db: Session = Depends(database.get_db)):
    """
    Twilio requests this endpoint with the Digits the user pressed.
    """
    form_data = await request.form()
    digits = form_data.get("Digits", "")
    
    user_id = request.query_params.get("user_id")
    checkin_id = request.query_params.get("checkin_id")

    response = VoiceResponse()

    if not user_id or not checkin_id:
        response.say("Sorry, an error occurred.")
        return Response(content=str(response), media_type="application/xml")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    checkin = db.query(models.CheckInTrack).filter(models.CheckInTrack.id == int(checkin_id)).first()

    if not user or not checkin:
        response.say("Sorry, we could not find your record.")
        return Response(content=str(response), media_type="application/xml")

    if digits == "1":
        # User is safe
        checkin.status = "completed"
        checkin.responded_at = datetime.utcnow()
        db.commit()
        response.say("Thank you. Your check-in is complete. Stay safe.")

    elif digits == "2":
        # User needs help
        checkin.status = "missed"
        checkin.responded_at = datetime.utcnow()
        db.commit()
        
        response.say("We are alerting your emergency contact immediately. Please stay safe.")

        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and user.emergency_contact_phone:
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            emergency_number = user.emergency_contact_phone.replace(" ", "")
            contact_name = user.emergency_contact_name or "Emergency Contact"
            msg = (
                f"URGENT: {user.name} pressed 2 (needs help) during an automated r u good? "
                f"voice call. Please contact them immediately."
            )
            ok = _send_sms(client, emergency_number, msg)
            _log_alert(db, user.id, checkin.id, "emergency_voice",
                       contact_name, emergency_number, msg, ok)
    else:
        # Invalid input
        response.say("Invalid input received. Goodbye.")

    return Response(content=str(response), media_type="application/xml")
