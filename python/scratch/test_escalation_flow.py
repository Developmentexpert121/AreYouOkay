import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from scheduler import escalations_check, check_and_send_messages

def test_flow():
    db: Session = SessionLocal()
    try:
        # 1. Get the user
        user = db.query(models.User).filter(models.User.email == 'saniyatanyal1@gmail.com').first()
        if not user:
            print("User not found")
            return

        print(f"Testing flow for user: {user.name} ({user.id})")
        print(f"Twilio Phone: {os.getenv('TWILIO_PHONE_NUMBER')}")

        # Clear previous logs and checkins for fresh test
        db.query(models.CheckInTrack).filter(models.CheckInTrack.user_id == user.id).delete()
        db.query(models.AlertLog).filter(models.AlertLog.user_id == user.id).delete()
        db.commit()

        # 2. Simulate Initial Check-in
        print("\n--- Phase 1: Triggering Initial Check-in ---")
        # To trigger initial check-in via check_and_send_messages, 
        # we need to make sure the time matches or just create one manually.
        # Let's create one manually with status 'pending' and scheduled_for 7 hours ago.
        now_utc = datetime.utcnow()
        scheduled_time = now_utc - timedelta(minutes=370) # 6h 10m ago (past the 360m reminder delay)
        
        checkin = models.CheckInTrack(
            user_id=user.id,
            scheduled_for=scheduled_time,
            status="pending",
            reminder_sent=False
        )
        db.add(checkin)
        db.commit()
        print(f"Created manual 'pending' check-in scheduled for {scheduled_time}")

        # 3. Trigger Reminder
        print("\n--- Phase 2: Triggering Reminder ---")
        escalations_check()
        
        db.refresh(checkin)
        print(f"Check-in Status after reminder trigger: {checkin.status}")
        
        reminder_log = db.query(models.AlertLog).filter(
            models.AlertLog.user_id == user.id,
            models.AlertLog.alert_type == "reminder"
        ).first()
        if reminder_log:
            print(f"Reminder Log Found: Success={reminder_log.success}, To={reminder_log.contact_phone}")
        else:
            print("No Reminder Log Found")

        # 4. Trigger Escalation 1 (SMS to Contact 1)
        print("\n--- Phase 3: Triggering Escalation 1 (SMS) ---")
        # Update scheduled_for to be past reminder_delay + escalation_delay (360 + 120 = 480 mins)
        checkin.scheduled_for = now_utc - timedelta(minutes=490)
        db.commit()
        
        escalations_check()
        
        db.refresh(checkin)
        print(f"Check-in Status after escalation 1 trigger: {checkin.status}")
        
        escalation_log = db.query(models.AlertLog).filter(
            models.AlertLog.user_id == user.id,
            models.AlertLog.alert_type == "escalated_1_sms"
        ).first()
        if escalation_log:
            print(f"Escalation 1 Log Found: Success={escalation_log.success}, To={escalation_log.contact_phone}")
        else:
            print("No Escalation 1 Log Found")

    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
