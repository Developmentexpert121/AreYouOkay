import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import scheduler
from twilio.rest import Client

def get_db():
    return SessionLocal()

def init_user(db, phone_number):
    user = db.query(models.User).filter_by(email="live_test@example.com").first()
    if user:
        db.query(models.CheckInTrack).filter_by(user_id=user.id).delete()
        db.delete(user)
        db.commit()
    
    print(f"DEBUG: SID={bool(os.getenv('TWILIO_ACCOUNT_SID'))}, TOKEN={bool(os.getenv('TWILIO_AUTH_TOKEN'))}")
    
    user = models.User(
        name="Live Tester",
        email="live_test@example.com",
        phone_number=phone_number,
        timezone="UTC",
        check_in_time="00:00",
        emergency_contact_name="Contact One",
        emergency_contact_phone=phone_number,
        emergency_contact_name_2="Contact Two",
        emergency_contact_phone_2=phone_number,
        emergency_contact_name_3="Contact Three",
        emergency_contact_phone_3=phone_number,
        subscription_status="active",
        reminder_delay_minutes=360,
        escalation_delay_minutes=120
    )
    db.add(user)
    db.commit()
    return user

def step_1_checkin(phone_number):
    db = get_db()
    user = init_user(db, phone_number)
    now = datetime.utcnow()
    user.check_in_time = now.strftime("%H:%M")
    db.commit()
    scheduler.check_and_send_messages()
    print("Step 1: Initial Check-in SMS sent.")
    db.close()

def step_2_reminder(phone_number):
    db = get_db()
    user = db.query(models.User).filter_by(email="live_test@example.com").first()
    checkin = db.query(models.CheckInTrack).filter_by(user_id=user.id).order_by(models.CheckInTrack.id.desc()).first()
    checkin.scheduled_for = datetime.utcnow() - timedelta(minutes=361)
    db.commit()
    scheduler.escalations_check()
    print("Step 2: Reminder SMS sent.")
    db.close()

def step_3_user_voice(phone_number):
    db = get_db()
    user = db.query(models.User).filter_by(email="live_test@example.com").first()
    checkin = db.query(models.CheckInTrack).filter_by(user_id=user.id).order_by(models.CheckInTrack.id.desc()).first()
    checkin.scheduled_for = datetime.utcnow() - timedelta(minutes=421)
    db.commit()
    scheduler.escalations_check()
    print("Step 3: User Voice Call initiated.")
    db.close()

def step_4_contact_sms(phone_number):
    db = get_db()
    user = db.query(models.User).filter_by(email="live_test@example.com").first()
    checkin = db.query(models.CheckInTrack).filter_by(user_id=user.id).order_by(models.CheckInTrack.id.desc()).first()
    checkin.scheduled_for = datetime.utcnow() - timedelta(minutes=481)
    db.commit()
    scheduler.escalations_check()
    print("Step 4: Contact 1 SMS sent.")
    db.close()

def step_5_contact_voice(phone_number):
    db = get_db()
    user = db.query(models.User).filter_by(email="live_test@example.com").first()
    checkin = db.query(models.CheckInTrack).filter_by(user_id=user.id).order_by(models.CheckInTrack.id.desc()).first()
    checkin.scheduled_for = datetime.utcnow() - timedelta(minutes=496)
    db.commit()
    scheduler.escalations_check()
    print("Step 5: Contact 1 Voice Call initiated.")
    db.close()

if __name__ == "__main__":
    step = sys.argv[1]
    phone = sys.argv[2]
    
    if step == "1": step_1_checkin(phone)
    elif step == "2": step_2_reminder(phone)
    elif step == "3": step_3_user_voice(phone)
    elif step == "4": step_4_contact_sms(phone)
    elif step == "5": step_5_contact_voice(phone)
