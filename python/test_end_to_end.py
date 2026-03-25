import sys
import os
import pytz
from datetime import datetime, timedelta

# Mocking Twilio Send SMS
import builtins
orig_print = builtins.print
logs = []
def mock_print(*args, **kwargs):
    orig_print(*args, **kwargs)
    logs.append(" ".join(str(a) for a in args))

builtins.print = mock_print

import scheduler
from database import SessionLocal
import models

# 1. Mock the twilio functions so we don't spam real numbers
def mock_get_twilio_client():
    class DummyClient:
        pass
    return DummyClient()

def mock_send_sms(client, to, body):
    print(f"[TWILIO MOCK] SMS TO {to}: {body}")
    return True

def mock_calls_create(to, from_, url):
    print(f"[TWILIO MOCK] VOICE RECORDING TO {to} (TwiML URL: {url})")
    class DummyCall:
        pass
    return DummyCall()

scheduler.get_twilio_client = mock_get_twilio_client
scheduler._send_sms = mock_send_sms

class MockCalls:
    def create(self, **kwargs):
        return mock_calls_create(**kwargs)

# We monkey-patch the client object returned in the function 
# Or we just let our mock_send_sms do the work. Wait, voice calls use client.calls.create
def mock_escalate_voice_to_contact(db, client, user, checkin, contact_name, contact_phone, alert_type, status_to_set):
    if not contact_phone:
        checkin.status = status_to_set
        db.commit()
        return
    emergency_number = contact_phone.replace(" ", "")
    print(f"[TWILIO MOCK] VOICE CALL TO {emergency_number} (Contact: {contact_name}) (Status: {status_to_set})")
    checkin.status = status_to_set
    db.commit()
    scheduler._log_alert(db, user.id, checkin.id, alert_type, contact_name, emergency_number, "Initiating automated voice call", True)

scheduler.escalate_voice_to_contact = mock_escalate_voice_to_contact


def test_end_to_end():
    db = SessionLocal()
    
    # Setup test user
    user = db.query(models.User).filter_by(email="test_e2e@example.com").first()
    if not user:
        user = models.User(
            name="Test User",
            email="test_e2e@example.com",
            phone_number="+15555555555",
            timezone="UTC",
            check_in_time="09:00",
            emergency_contact_name="Contact One",
            emergency_contact_phone="+11111111111",
            emergency_contact_name_2="Contact Two",
            emergency_contact_phone_2="+22222222222",
            emergency_contact_name_3="Contact Three",
            emergency_contact_phone_3="+33333333333",
            subscription_status="active",
            reminder_delay_minutes=360,     # 6 hours
            escalation_delay_minutes=30     # 0.5 hours before first alert
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    print("\n--- TEST PHASE 1: INITIAL CHECK-IN CREATION ---")
    # Simulate current time matching the user's check_in_time
    now = datetime.utcnow()
    # Temporarily set user's check-in time to right now
    user.check_in_time = now.strftime("%H:%M")
    db.commit()
    
    scheduler.check_and_send_messages()
    
    checkin = db.query(models.CheckInTrack).filter_by(user_id=user.id, status="pending").first()
    if checkin:
        print(f"SUCCESS: CheckInTrack created with ID {checkin.id} and status pending.")
    else:
        print("FAIL: No pending checkin found!")
        return
        
    print("\n--- TEST PHASE 2: ABORT / DAILY BEHAVIOR (YES REPLY) ---")
    # Simulate Twilio YES reply (we set status to completed)
    checkin.status = "completed"
    db.commit()
    
    # Run escalations_check, should ignore it
    scheduler.escalations_check()
    
    print("\n--- TEST PHASE 3: CASCADING ESCALATION TIMELINE ---")
    # Create a fresh checkin in pending state
    checkin2 = models.CheckInTrack(user_id=user.id, scheduled_for=now, status="pending")
    db.add(checkin2)
    db.commit()
    db.refresh(checkin2)
    
    time_lapses = [
        (359, "Before Reminder window"),
        (360, "Exactly at Reminder window (6h)"),
        (389, "Before Contact 1 window"),
        (390, "Exactly at Contact 1 window (6.5h)"),
        (390 + 15, "Contact 1 Voice Call (6.75h)"),
        (390 + 15 + 119, "Before Contact 2 window"),
        (390 + 15 + 120, "Contact 2 SMS window (8.75h)"),
        (390 + 30 + 120, "Contact 2 Voice window"),
        (390 + 15 + 240, "Contact 3 SMS window"),
        (390 + 30 + 240, "Contact 3 Voice window"),
        (390 + 30 + 300, "End of Line -> Missed")
    ]
    
    for minutes_advanced, desc in time_lapses:
        print(f"\n[{desc}] Advancing time by {minutes_advanced} minutes...")
        
        # Monkey patch datetime.utcnow inside scheduler to time travel
        class MockDatetime(datetime):
            @classmethod
            def utcnow(cls):
                return now + timedelta(minutes=minutes_advanced)
        
        scheduler.datetime = MockDatetime
        
        scheduler.escalations_check()
        db.refresh(checkin2)
        print(f"CURRENT STATUS: {checkin2.status}")

    print("\n--- TEST PHASE 4: FALSE ALARM RESOLUTION ---")
    # If a user replies YES after it was escalated
    checkin3 = models.CheckInTrack(user_id=user.id, scheduled_for=now, status="escalated_2_sms")
    db.add(checkin3)
    db.commit()
    db.refresh(checkin3)
    
    import routers.twilio
    routers.twilio._send_sms = mock_send_sms
    routers.twilio.TWILIO_ACCOUNT_SID = "mock"
    routers.twilio.TWILIO_AUTH_TOKEN = "mock"
    routers.twilio.Client = mock_get_twilio_client
    
    # We will simulate the precise logic inside the twilio webhook for a YES
    previous_status = checkin3.status
    checkin3.status = "completed"
    checkin3.responded_at = datetime.utcnow()
    db.commit()
    
    escalated_statuses = {"escalated_1_sms", "escalated_1_voice", "escalated_2_sms", "escalated_2_voice", "escalated_3_sms", "escalated_3_voice"}
    if previous_status in escalated_statuses:
        msg = f"UPDATE: {user.name} has just replied to their AreYouOkay check-in and is safe. The previous alert was a false alarm."
        for contact in [
            (user.emergency_contact_phone, user.emergency_contact_name),
            (user.emergency_contact_phone_2, user.emergency_contact_name_2),
            (user.emergency_contact_phone_3, user.emergency_contact_name_3)
        ]:
            if contact[0]:
                mock_send_sms(None, contact[0], msg)
    
    print("\n--- FINISHED ---")

if __name__ == "__main__":
    test_end_to_end()
