from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import database, models, schemas
import shutil
import os
import uuid
import bcrypt
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
import json
import base64

load_dotenv()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

router = APIRouter(prefix="/users", tags=["users"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        # Fallback for legacy "password+hash" records during migration
        return hashed == password + "hash"


def send_reset_email(to_email: str, reset_link: str):
    smtp_host = os.environ.get("MAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("MAIL_PORT", 587))
    smtp_user = os.environ.get("MAIL_USERNAME")
    smtp_pass = os.environ.get("MAIL_PASSWORD")
    from_email = os.environ.get("MAIL_FROM_ADDRESS", smtp_user)
    from_name = os.environ.get("MAIL_FROM_NAME", "AreYouOkay AI")

    if not smtp_user or not smtp_pass:
        print("SMTP credentials not configured. Email will not be sent.")
        return False

    msg = MIMEMultipart()
    msg['From'] = f"{from_name} <{from_email}>"
    msg['To'] = to_email
    msg['Subject'] = "Reset Your Password - AreYouOkay"

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
          <p style="color: #555555; font-size: 16px;">Hello,</p>
          <p style="color: #555555; font-size: 16px;">We received a request to reset your password for your AreYouOkay account. If you didn't make this request, you can safely ignore this email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #555555; font-size: 16px;">Or copy and paste this link into your browser:</p>
          <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">{reset_link}</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="color: #999999; font-size: 12px; text-align: center;">AreYouOkay AI &copy; 2026</p>
        </div>
      </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = user.dict()
    password = user_data.pop("password")
    user_data["hashed_password"] = hash_password(password)

    new_user = models.User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/forgot-password")
def forgot_password(request: schemas.PasswordResetRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        return {"message": "If this email is registered, you will receive a reset link."}

    token = str(uuid.uuid4())
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    app_base_url = os.environ.get("APP_FRONTEND_URL", "http://localhost:8080")
    reset_link = f"{app_base_url}/reset-password?token={token}&email={user.email}"
    print(f"\n[PASSWORD RESET] Link for {user.email}: {reset_link}\n")

    # Send the email
    send_reset_email(user.email, reset_link)

    return {"message": "Success", "token_dev": token}


@router.post("/reset-password")
def reset_password(confirm: schemas.PasswordResetConfirm, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        models.User.reset_token == confirm.token,
        models.User.reset_token_expires > datetime.utcnow()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = hash_password(confirm.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/login", response_model=schemas.UserResponse)
def login_user(creds: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Normal login logic

    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@router.get("/login/google")
async def login_google(request: Request):
    if not os.environ.get("GOOGLE_CLIENT_ID"):
        # Fallback if unconfigured to prevent crash, pass error to frontend
        frontend_url = os.environ.get("APP_FRONTEND_URL", "http://localhost:8080")
        return RedirectResponse(url=f"{frontend_url}/login?error=Google_Auth_Not_Configured")
        
    app_base_url = os.environ.get("APP_BASE_URL")
    if app_base_url:
        # On production (DigitalOcean), ensure this includes the /api prefix if routed that way
        base_url = app_base_url.rstrip("/")
        redirect_uri = f"{base_url}/users/login/google/callback"
    else:
        # For localhost dev, this auto-detects http://127.0.0.1:8000 or http://localhost:8000
        redirect_uri = str(request.url_for('login_google_callback'))
    
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/login/google/callback")
async def login_google_callback(request: Request, db: Session = Depends(database.get_db)):
    frontend_url = os.environ.get("APP_FRONTEND_URL", "http://localhost:8080").rstrip("/")
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if not user_info:
            user_info = await oauth.google.parse_id_token(request, token)
            
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")
            
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            name = user_info.get("name", email.split("@")[0])
            user = models.User(
                name=name,
                email=email,
                phone_number="",
                timezone="UTC",
                check_in_time="09:00",
                hashed_password=hash_password(str(uuid.uuid4()))
            )
            db.add(user)
            db.commit()
            db.refresh(user)


        # Use reset_token as a temporary login token to avoid large base64 strings in URL
        temp_token = str(uuid.uuid4())
        user.reset_token = temp_token
        # Token expires in 5 minutes
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=5)
        db.commit()
        
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={temp_token}")
        
    except Exception as e:
        print(f"[OAuth Error]: {e}")
        return RedirectResponse(url=f"{frontend_url}/login?error=Google_Auth_Failed")


@router.post("/exchange-token")
async def exchange_token(payload: dict, db: Session = Depends(database.get_db)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
    
    user = db.query(models.User).filter(
        models.User.reset_token == token,
        models.User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone_number": getattr(user, "phone_number", ""),
        "emergency_contact_name": getattr(user, "emergency_contact_name", ""),
        "emergency_contact_phone": getattr(user, "emergency_contact_phone", ""),
        "emergency_contact_name_2": getattr(user, "emergency_contact_name_2", ""),
        "emergency_contact_phone_2": getattr(user, "emergency_contact_phone_2", ""),
        "subscription_status": user.subscription_status,
        "profile_picture": user.profile_picture,
        "timezone": user.timezone,
        "check_in_time": str(user.check_in_time) if user.check_in_time else None
    }
    
    # Clear the token after use
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return user_dict


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.User).offset(skip).limit(limit).all()


@router.get("/admin/all")
def get_admin_dashboard_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    results = []
    for u in users:
        completed = db.query(models.CheckInTrack).filter(
            models.CheckInTrack.user_id == u.id,
            models.CheckInTrack.status == "completed"
        ).count()
        missed = db.query(models.CheckInTrack).filter(
            models.CheckInTrack.user_id == u.id,
            models.CheckInTrack.status == "missed"
        ).count()
        results.append({
            "id": u.id,
            "name": u.name,
            "phone": u.phone_number,
            "email": u.email,
            "timezone": u.timezone,
            "status": "active" if u.subscription_status == "active" else "inactive",
            "checkins": completed,
            "missed": missed
        })
    return results


@router.get("/admin/alerts", response_model=list[schemas.AlertLogResponse])
def get_alert_logs(skip: int = 0, limit: int = 200, db: Session = Depends(database.get_db)):
    """Return all alert logs for the admin dashboard."""
    return db.query(models.AlertLog).order_by(models.AlertLog.sent_at.desc()).offset(skip).limit(limit).all()


@router.get("/{user_id}/checkins", response_model=list[schemas.CheckInResponse])
def get_user_checkins(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.CheckInTrack).filter(
        models.CheckInTrack.user_id == user_id
    ).order_by(models.CheckInTrack.scheduled_for.desc()).limit(30).all()


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/{user_id}/avatar", response_model=schemas.UserResponse)
def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_path = f"uploads/{user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.profile_picture = f"/{file_path}"
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}/avatar", response_model=schemas.UserResponse)
def delete_avatar(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.profile_picture:
        user.profile_picture = None
        db.commit()
        db.refresh(user)

    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    """Delete a user and all their associated check-ins and alert logs."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(models.AlertLog).filter(models.AlertLog.user_id == user_id).delete()
    db.query(models.CheckInTrack).filter(models.CheckInTrack.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}


@router.put("/{user_id}/suspend")
def suspend_user(user_id: int, db: Session = Depends(database.get_db)):
    """Toggle a user's subscription between active and inactive (suspend/unsuspend)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.subscription_status = "inactive" if user.subscription_status == "active" else "active"
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "subscription_status": user.subscription_status}
