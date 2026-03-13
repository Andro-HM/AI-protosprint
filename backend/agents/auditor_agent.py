"""
The Auditor Agent - Scans for broken habit streaks
"""
from datetime import datetime, date, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict
import os


def calculate_streak(completions: List[dict]) -> int:
    """Calculate the current streak from a list of completion dates"""
    if not completions:
        return 0
    
    # Sort by date descending
    sorted_completions = sorted(
        completions,
        key=lambda x: datetime.fromisoformat(x['completed_date']) if isinstance(x['completed_date'], str) else x['completed_date'],
        reverse=True
    )
    
    streak = 0
    expected_date = date.today()
    
    for completion in sorted_completions:
        comp_date = completion['completed_date']
        if isinstance(comp_date, str):
            comp_date = datetime.fromisoformat(comp_date).date()
        elif isinstance(comp_date, datetime):
            comp_date = comp_date.date()
        
        if comp_date == expected_date or comp_date == expected_date - timedelta(days=1):
            streak += 1
            expected_date = comp_date - timedelta(days=1)
        else:
            break
    
    return streak


async def run_auditor(user_id: str, db) -> List[Dict]:
    """
    Scans for broken streaks and returns list of broken habits
    
    Args:
        user_id: The user to scan
        db: MongoDB database connection
    
    Returns:
        List of broken streaks with details
    """
    broken_streaks = []
    
    # Get all active habits for user
    habits = await db.habits.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(100)
    
    if not habits:
        return broken_streaks
    
    # Check last 2 days for each habit
    today = date.today()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)
    
    for habit in habits:
        # Check if completed in last 2 days
        recent_completion = await db.completions.find_one({
            "habit_id": habit['id'],
            "completed_date": {"$gte": two_days_ago.isoformat()}
        })
        
        # If no completion in last 2 days → streak broken
        if not recent_completion:
            # Calculate previous streak length
            all_completions = await db.completions.find({
                "habit_id": habit['id']
            }).sort("completed_date", -1).to_list(1000)
            
            previous_streak = calculate_streak(all_completions)
            
            # Only fire if streak was meaningful (3+ days)
            if previous_streak >= 3:
                broken_streaks.append({
                    "habit_id": habit['id'],
                    "habit_name": habit['name'],
                    "streak_broken_days": 2,
                    "previous_streak_length": previous_streak
                })
                
                # Log to agent_logs
                await db.agent_logs.insert_one({
                    "id": str(__import__('uuid').uuid4()),
                    "agent_name": "Auditor",
                    "user_id": user_id,
                    "action": "BROKEN_STREAK_DETECTED",
                    "payload": {
                        "habit_name": habit['name'],
                        "previous_streak": previous_streak
                    },
                    "status": "success",
                    "created_at": datetime.utcnow().isoformat()
                })
    
    return broken_streaks
