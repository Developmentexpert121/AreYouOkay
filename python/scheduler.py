import os
import pytz
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from twilio.rest import Client

from dotenv import load_dotenv
load_dotenv()

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
            
            try:
                hour_str, minute_str = user.check_in_time.split(":")
                target_hour, target_minute = int(hour_str), int(minute_str)
            except Exception:
                target_hour, target_minute = 9, 0  # Fallback
            
            target_local_dt = local_time.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
            target_utc_dt = target_local_dt.astimezone(pytz.utc).replace(tzinfo=None)

            if local_time >= target_local_dt:
                # Check if the user has ALREADY COMPLETED a check-in for today.
                # If they have, we don't send any more messages for the day.
                
                start_of_day_local = target_local_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day_local = start_of_day_local + timedelta(days=1)
                
                start_of_day_utc = start_of_day_local.astimezone(pytz.utc).replace(tzinfo=None)
                end_of_day_utc = end_of_day_local.astimezone(pytz.utc).replace(tzinfo=None)

                completed_today = db.query(models.CheckInTrack).filter(
                    models.CheckInTrack.user_id == user.id,
                    models.CheckInTrack.scheduled_for >= start_of_day_utc,
                    models.CheckInTrack.scheduled_for < end_of_day_utc,
                    models.CheckInTrack.status.in_(["completed", "emergency_acknowledged"])
                ).first()

                if completed_today:
                    continue

                # Check if a check-in already exists for THIS SPECIFIC target time
                # This allows re-triggering if the user changes their time to a later slot on the same day,
                # as long as they haven't finished a check-in yet.
                existing = db.query(models.CheckInTrack).filter(
                    models.CheckInTrack.user_id == user.id,
                    models.CheckInTrack.scheduled_for == target_utc_dt
                ).first()

                if not existing:
                    new_checkin = models.CheckInTrack(
                        user_id=user.id,
                        scheduled_for=target_utc_dt,
                        status="pending",
                        reminder_sent=False
                    )
                    db.add(new_checkin)
                    db.commit()

                    if client and user.phone_number:
                        body = f"Hi {user.name}, r u good? Type y for yes. Or N for no."
                        phone_to_send = str(user.phone_number).replace(" ", "")
                        ok = _send_sms(client, phone_to_send, body)
                        _log_alert(db, user.id, new_checkin.id, "initial_checkin", user.name, phone_to_send, body, ok)
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
    base_url = os.getenv("APP_BASE_URL", "https://orca-app-8rqa7.ondigitalocean.app/api")
    
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
            reminder_delay = user.reminder_delay_minutes if user.reminder_delay_minutes is not None else 360 # 6 hours
            escalation_delay = user.escalation_delay_minutes if user.escalation_delay_minutes is not None else 120 # 2 hours
            
            # --- T+Reminder Delay: Send reminder SMS to user ---
            if checkin.status == "pending" and elapsed_mins >= reminder_delay:
                checkin.reminder_sent = True
                checkin.status = "reminded"
                db.commit()

                if client and user.phone_number:
                    body = f"Hi {user.name}, r u good? Type y for yes. Or N for no."
                    phone_to_send = str(user.phone_number).replace(" ", "")
                    ok = _send_sms(client, phone_to_send, body)
                    _log_alert(db, user.id, checkin.id, "reminder", user.name, phone_to_send, body, ok)

            # --- Step 1: Contact 1 SMS ---
            elif checkin.status == "reminded" and elapsed_mins >= reminder_delay + escalation_delay:
                escalate_sms_to_contact(db, client, user, checkin, user.emergency_contact_name, user.emergency_contact_phone, "escalated_1_sms", "escalated_1_sms")

            # --- Step 2: Contact 2 SMS --- 120 mins after Contact 1 SMS
            elif checkin.status == "escalated_1_sms" and elapsed_mins >= reminder_delay + (2 * escalation_delay):
                escalate_sms_to_contact(db, client, user, checkin, user.emergency_contact_name_2, user.emergency_contact_phone_2, "escalated_2_sms", "escalated_2_sms")
                
            # --- Step 3: Contact 3 SMS --- 120 mins after Contact 2 SMS
            elif checkin.status == "escalated_2_sms" and elapsed_mins >= reminder_delay + (3 * escalation_delay):
                escalate_sms_to_contact(db, client, user, checkin, user.emergency_contact_name_3, user.emergency_contact_phone_3, "escalated_3_sms", "escalated_3_sms")
                
            # --- End of Line: Keep calling missed ---
            elif checkin.status == "escalated_3_sms" and elapsed_mins >= reminder_delay + (4 * escalation_delay):
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
