import os
import sys
from datetime import datetime, timedelta
import pytz

# Add the python directory to sys.path
sys.path.append('c:/Users/Pc/Desktop/AreYouOkay/python')

import models
from database import SessionLocal, engine

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # 1. Create a test user if not exists
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    if not user:
        user = models.User(
            name="Test User",
            email="test@example.com",
            phone_number="+1234567890",
            timezone="UTC",
            check_in_time="08:00",
            subscription_status="active",
            reminder_delay_minutes=60,
            escalation_delay_minutes=60
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Simulate multiple active check-ins (what used to happen)
    now = datetime.utcnow()
    c1 = models.CheckInTrack(user_id=user.id, scheduled_for=now - timedelta(hours=2), status="pending")
    c2 = models.CheckInTrack(user_id=user.id, scheduled_for=now - timedelta(hours=1), status="reminded")
    db.add_all([c1, c2])
    db.commit()

    print(f"Created two active check-ins: {c1.id} (pending), {c2.id} (reminded)")

    # 3. Simulate the new twilio_webhook logic (simplified)
    from_number_clean = "+1234567890"
    active_checkins = db.query(models.CheckInTrack).filter(
        models.CheckInTrack.user_id == user.id,
        models.CheckInTrack.status.notin_(["completed", "missed", "emergency_acknowledged"])
    ).all()

    print(f"Found {len(active_checkins)} active check-ins to resolve.")
    for c in active_checkins:
        c.status = "completed"
        c.responded_at = datetime.utcnow()
    db.commit()

    # Verify both are completed
    db.refresh(c1)
    db.refresh(c2)
    print(f"Check-in {c1.id} status: {c1.status}")
    print(f"Check-in {c2.id} status: {c2.status}")

    # 4. Test the scheduler same-day check
    from scheduler import check_and_send_messages
    
    # We'll mock the user's check_in_time to match 'now'
    user.check_in_time = (now).strftime("%H:%M")
    db.commit()
    
    print(f"Running scheduler check for {user.name} at {user.check_in_time}...")
    # This should find the check-ins we just 'completed' for today and NOT create a new one
    check_and_send_messages()
    
    # Check if any new check-in was created for this user today
    count = db.query(models.CheckInTrack).filter(
        models.CheckInTrack.user_id == user.id,
        models.CheckInTrack.scheduled_for >= now.replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    print(f"Total check-ins for today: {count} (should be 2 or 3 depending on when the script is run, but no NEW pending ones)")
    
    new_pending = db.query(models.CheckInTrack).filter(
        models.CheckInTrack.user_id == user.id,
        models.CheckInTrack.status == "pending",
        models.CheckInTrack.scheduled_for >= now - timedelta(minutes=5)
    ).first()
    
    if new_pending:
        print(f"FAIL: New pending check-in created! ID: {new_pending.id}")
    else:
        print("SUCCESS: No new pending check-in created.")

finally:
    # Cleanup
    # db.query(models.CheckInTrack).filter(models.CheckInTrack.user_id == user.id).delete()
    # db.commit()
    db.close()
