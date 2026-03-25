from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone_number = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    check_in_time = Column(String)  # e.g., "08:00"

    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_name_2 = Column(String, nullable=True)
    emergency_contact_phone_2 = Column(String, nullable=True)
    emergency_contact_name_3 = Column(String, nullable=True)
    emergency_contact_phone_3 = Column(String, nullable=True)

    subscription_status = Column(String, default="inactive")
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)

    # Configurable escalation delays (minutes)
    reminder_delay_minutes = Column(Integer, default=30)
    escalation_delay_minutes = Column(Integer, default=60)

    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CheckInTrack(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    scheduled_for = Column(DateTime)
    status = Column(String, default="pending")  # pending, reminded, completed, missed, escalated
    reminder_sent = Column(Boolean, default=False)
    responded_at = Column(DateTime, nullable=True)


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    checkin_id = Column(Integer, ForeignKey("check_ins.id"), nullable=True)
    alert_type = Column(String)  # "reminder", "emergency_no", "emergency_missed"
    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    message_body = Column(String, nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
    success = Column(Boolean, default=True)
