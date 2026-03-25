import os
import pytz
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


def get_twilio_client():
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    return None


def _send_sms(client, to: str, body: str) -> bool:
    """Send SMS and return True on success."""
    try:
        client.messages.create(body=body, from_=TWILIO_PHONE_NUMBER, to=to)
        return True
    except Exception as e:
        print(f"SMS send error to {to}: {e}")
        return False


def _log_alert(db: Session, user_id: int, checkin_id: int, alert_type: str,
               contact_name: str, contact_phone: str, message_body: str, success: bool):
    """Write an AlertLog entry."""
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


def check_and_send_messages():
    """Send the daily check-in SMS to each active user at their preferred time."""
    db: Session = SessionLocal()
    try:
        now_utc = datetime.utcnow()
        users = db.query(models.User).filter(models.User.subscription_status == "active").all()
        client = get_twilio_client()

        for user in users:
            try:
                tz = pytz.timezone(user.timezone)
            except Exception:
                tz = pytz.utc

            local_time = now_utc.replace(tzinfo=pytz.utc).astimezone(tz)
            current_hm = local_time.strftime("%H:%M")

            if current_hm == user.check_in_time:
                today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
                existing = db.query(models.CheckInTrack).filter(
                    models.CheckInTrack.user_id == user.id,
                    models.CheckInTrack.scheduled_for >= today_start
                ).first()

                if not existing:
                    new_checkin = models.CheckInTrack(
                        user_id=user.id,
                        scheduled_for=now_utc,
                        status="pending",
                        reminder_sent=False
                    )
                    db.add(new_checkin)
                    db.commit()

                    if client and user.phone_number:
                        _send_sms(
                            client,
                            user.phone_number,
                            f"Hi {user.name}, r u good? Type y for yes. Or N for no."
                        )
    except Exception as e:
        print(f"Scheduler check_and_send_messages error: {e}")
    finally:
        db.close()


def escalate_sms_to_contact(db, client, user, checkin, contact_name, contact_phone, alert_type, status_to_set):
    """Helper to send the standardized emergency contact SMS and log it."""
    if not contact_phone:
        checkin.status = status_to_set
        db.commit()
        return

    emergency_number = contact_phone.replace(" ", "")
    body = f"{user.name} has you as an emergency contact. Please check in to make sure that everything is ok, and let us know. Thanks."
    
    checkin.status = status_to_set
    db.commit()
    
    if client:
        ok = _send_sms(client, emergency_number, body)
        _log_alert(db, user.id, checkin.id, alert_type, contact_name or "Emergency Contact", emergency_number, body, ok)


def escalate_voice_to_contact(db, client, user, checkin, contact_name, contact_phone, alert_type, status_to_set):
    """Helper to place the automated emergency voice call and log it."""
    if not contact_phone:
        checkin.status = status_to_set
        db.commit()
        return
        
    emergency_number = contact_phone.replace(" ", "")
    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
    
    checkin.status = status_to_set
    db.commit()
    
    if client:
        try:
            call = client.calls.create(
                to=emergency_number,
                from_=TWILIO_PHONE_NUMBER,
                url=f"{base_url}/webhook/twilio/voice/emergency?user_id={user.id}&checkin_id={checkin.id}"
            )
            _log_alert(db, user.id, checkin.id, alert_type, contact_name or "Emergency Contact", emergency_number, "Initiating automated voice call to emergency contact.", True)
        except Exception as e:
            print(f"Failed voice call to {emergency_number}: {e}")
            _log_alert(db, user.id, checkin.id, alert_type, contact_name or "Emergency Contact", emergency_number, f"Voice call failed: {e}", False)


def escalations_check():
    """
    Evaluates check-ins and pushes them through the escalation funnel:
    pending -> reminded -> escal_1_sms -> escal_1_voice -> escal_2_sms -> escal_2_voice
    """
    db: Session = SessionLocal()
    try:
        now_utc = datetime.utcnow()
        client = get_twilio_client()

        # We must pull all check-ins that are NOT in a terminal resolved state.
        active_checkins = db.query(models.CheckInTrack).filter(
            models.CheckInTrack.status.notin_(["completed", "missed", "emergency_acknowledged"])
        ).all()

        for checkin in active_checkins:
            user = db.query(models.User).filter(models.User.id == checkin.user_id).first()
            if not user:
                continue
                
            elapsed_mins = (now_utc - checkin.scheduled_for).total_seconds() / 60.0
            reminder_delay = user.reminder_delay_minutes if user.reminder_delay_minutes is not None else 360
            escalation_delay = user.escalation_delay_minutes if user.escalation_delay_minutes is not None else 60
            
            # If the user replies NO, twilio webhook skips them straight to "escalated_1_sms" triggering rapid escalation
            
            # --- T+Reminder Delay: Send reminder SMS to user ---
            if checkin.status == "pending" and elapsed_mins >= reminder_delay:
                checkin.reminder_sent = True
                checkin.status = "reminded"
                db.commit()

                if client and user.phone_number:
                    body = f"AreYouOkay Reminder: We haven't heard from you yet. Please reply YES if you're okay, or NO if you need help."
                    ok = _send_sms(client, user.phone_number, body)
                    _log_alert(db, user.id, checkin.id, "reminder", user.name, user.phone_number, body, ok)

            # --- Step 1: Contact 1 SMS ---
            if checkin.status == "reminded" and elapsed_mins >= reminder_delay + escalation_delay:
                escalate_sms_to_contact(db, client, user, checkin, user.emergency_contact_name, user.emergency_contact_phone, "escalated_1_sms", "escalated_1_sms")
                
            # --- Step 1: Contact 1 Voice --- 15 mins after SMS
            if checkin.status == "escalated_1_sms" and elapsed_mins >= reminder_delay + escalation_delay + 15:
                escalate_voice_to_contact(db, client, user, checkin, user.emergency_contact_name, user.emergency_contact_phone, "escalated_1_voice", "escalated_1_voice")

            # --- Step 2: Contact 2 SMS --- 120 mins after Contact 1 SMS
            if checkin.status == "escalated_1_voice" and elapsed_mins >= reminder_delay + escalation_delay + 135:
                escalate_sms_to_contact(db, client, user, checkin, user.emergency_contact_name_2, user.emergency_contact_phone_2, "escalated_2_sms", "escalated_2_sms")
                
            # --- Step 2: Contact 2 Voice --- 15 mins after SMS
            if checkin.status == "escalated_2_sms" and elapsed_mins >= reminder_delay + escalation_delay + 150:
                escalate_voice_to_contact(db, client, user, checkin, user.emergency_contact_name_2, user.emergency_contact_phone_2, "escalated_2_voice", "escalated_2_voice")
                
            # --- End of Line: Keep calling missed ---
            if checkin.status == "escalated_2_voice" and elapsed_mins >= reminder_delay + escalation_delay + 270:
                checkin.status = "missed"
                db.commit()

    except Exception as e:
        print(f"Scheduler escalations_check error: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_send_messages, 'interval', minutes=1)
    scheduler.add_job(escalations_check, 'interval', minutes=5)
    scheduler.start()
