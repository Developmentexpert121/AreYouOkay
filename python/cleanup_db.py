from database import SessionLocal
import models

def purge_test_data():
    db = SessionLocal()
    try:
        # Delete users with "Test" in name or the old admin email
        test_users = db.query(models.User).filter(
            (models.User.name.like("%Test%")) | 
            (models.User.email == "developmentexpert121@gmail.com")
        ).all()
        
        for user in test_users:
            print(f"Deleting test user: {user.name} ({user.email})")
            # Delete associated data first
            db.query(models.AlertLog).filter(models.AlertLog.user_id == user.id).delete()
            db.query(models.CheckInTrack).filter(models.CheckInTrack.user_id == user.id).delete()
            db.delete(user)
        
        db.commit()
        print(f"Successfully deleted {len(test_users)} test users.")
    except Exception as e:
        print(f"Error purging test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    purge_test_data()
