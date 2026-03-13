from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, time
import uuid


# ============= SOCIAL FEATURES =============

class Friend(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    friend_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FriendRequestCreate(BaseModel):
    friend_email: str


class SharedHabit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    habit_id: str
    shared_by_user_id: str
    shared_with_user_id: str
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ShareHabitRequest(BaseModel):
    habit_id: str
    friend_email: str
    message: Optional[str] = None


class ActivityItem(BaseModel):
    user_name: str
    activity_type: str  # completed_habit, created_habit, shared_habit, streak_milestone
    description: str
    timestamp: datetime


# ============= NOTIFICATIONS =============

class NotificationPreference(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    email_reminders: bool = True
    daily_summary: bool = True
    friend_activity: bool = True
    streak_milestones: bool = True
    reminder_time: str = "09:00"  # HH:MM format
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationPreferenceUpdate(BaseModel):
    email_reminders: Optional[bool] = None
    daily_summary: Optional[bool] = None
    friend_activity: Optional[bool] = None
    streak_milestones: Optional[bool] = None
    reminder_time: Optional[str] = None


# ============= TEMPLATES =============

class HabitCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HabitTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    name: str
    description: str
    emoji: str
    color: str
    suggested_frequency: str = "daily"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BulkHabitCreate(BaseModel):
    template_ids: List[str]


# ============= PASSWORD RESET =============

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    used: bool = False


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ============= ACCOUNTABILITY COACH =============

class AccountabilityMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    habit_id: str
    habit_name: str
    message: str  # The AI generated message
    agent_reasoning: str  # Why agent chose this angle
    journal_reference: Optional[str] = None  # The journal excerpt used
    streak_broken_days: int
    previous_streak_length: int
    is_read: bool = False
    is_dismissed: bool = False
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


class AgentLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_name: str  # "Auditor" or "Enforcer"
    user_id: str
    action: str  # BROKEN_STREAK_DETECTED, MESSAGE_GENERATED, etc.
    payload: dict
    status: str  # success/failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
