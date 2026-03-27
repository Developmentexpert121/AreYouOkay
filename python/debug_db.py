import database
import models

def debug():
    db = database.SessionLocal()
    user = db.query(models.User).filter_by(email='live_test@example.com').first()
    if not user:
        print("User not found!")
        return
    
    print(f"User ID: {user.id}")
    print(f"Phone: {user.phone_number}")
    print(f"Check-in Time: {user.check_in_time}")
    print(f"Status: {user.subscription_status}")

    ck = db.query(models.CheckInTrack).filter_by(user_id=user.id).first()
    if not ck:
        print("Check-in NOT created!")
    else:
        print(f"Check-in ID: {ck.id}")
        print(f"Status: {ck.status}")
        print(f"Scheduled for: {ck.scheduled_for}")

    logs = db.query(models.AlertLog).filter_by(user_id=user.id).all()
    print(f"Alert Logs Found: {len(logs)}")
    for l in logs:
        print(f"  - Type: {l.alert_type}, Success: {l.success}, Phone: {l.contact_phone}")

if __name__ == "__main__":
    debug()
