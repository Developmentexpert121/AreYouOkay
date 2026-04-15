from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None
    timezone: Optional[str] = "UTC"
    check_in_time: Optional[str] = "09:00"
    emergency_contact_name: Optional[str] = ""
    emergency_contact_phone: Optional[str] = ""
    emergency_contact_name_2: Optional[str] = ""
    emergency_contact_phone_2: Optional[str] = ""
    reminder_delay_minutes: Optional[int] = 360
    escalation_delay_minutes: Optional[int] = 60


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class UserResponse(UserBase):
    id: int
    subscription_status: Optional[str] = "inactive"
    profile_picture: Optional[str] = None
    email_verified: Optional[bool] = False

    class Config:
        from_attributes = True


class EmailVerifyRequest(BaseModel):
    email: str
    code: str


class ResendVerificationRequest(BaseModel):
    email: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    timezone: Optional[str] = None
    check_in_time: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_name_2: Optional[str] = None
    emergency_contact_phone_2: Optional[str] = None
    reminder_delay_minutes: Optional[int] = None
    escalation_delay_minutes: Optional[int] = None


class CheckInResponse(BaseModel):
    id: int
    user_id: int
    scheduled_for: datetime
    status: str
    reminder_sent: Optional[bool] = False
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


class AlertLogResponse(BaseModel):
    id: int
    user_id: int
    checkin_id: Optional[int]
    alert_type: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    message_body: Optional[str]
    sent_at: datetime
    success: bool

    class Config:
        from_attributes = True
