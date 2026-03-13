"""
Seed Demo Account for DailyRoutine App
Creates a fully populated demo account with habits, completions, and journal entries
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import sys

sys.path.append(str(Path(__file__).parent.parent))
from backend.models import UserInDB, Habit, Completion, JournalEntry
from backend.auth import hash_password
import uuid

load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL'].strip('"')
db_name = os.environ['DB_NAME'].strip('"')


async def seed_demo_account():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Seeding demo account...")
    print("")
    
    # 1. CREATE DEMO USER
    print("1️⃣ Creating demo user...")
    demo_email = "demo@dailyroutine.com"
    
    # Check if user exists
    existing = await db.users.find_one({"email": demo_email})
    if existing:
        print(f"   ⚠️  Demo user already exists, deleting old data...")
        user_id = existing['id']
        # Delete all related data
        await db.habits.delete_many({"user_id": user_id})
        await db.completions.delete_many({"user_id": user_id})
        await db.journal_entries.delete_many({"user_id": user_id})
        await db.accountability_messages.delete_many({"user_id": user_id})
        await db.users.delete_one({"id": user_id})
    
    # Create user
    user_id = str(uuid.uuid4())
    user = UserInDB(
        id=user_id,
        name="Alex Johnson",
        email=demo_email,
        hashed_password=hash_password("Demo@1234")
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    print(f"   ✅ Created user: {demo_email}")
    print("")
    
    # 2. CREATE 5 HABITS
    print("2️⃣ Creating habits...")
    habits = [
        {"name": "📚 Read 20 pages", "emoji": "📚", "color": "blue"},
        {"name": "🧘 Meditation", "emoji": "🧘", "color": "purple"},
        {"name": "💪 Exercise", "emoji": "💪", "color": "emerald"},
        {"name": "💧 Drink 8 glasses of water", "emoji": "💧", "color": "sky"},
        {"name": "🛌 Sleep by 11 PM", "emoji": "🛌", "color": "indigo"},
    ]
    
    habit_ids = []
    for habit_data in habits:
        habit = Habit(user_id=user_id, **habit_data)
        habit_dict = habit.model_dump()
        habit_dict['created_at'] = habit_dict['created_at'].isoformat()
        await db.habits.insert_one(habit_dict)
        habit_ids.append(habit_dict['id'])
        print(f"   ✅ {habit_data['name']}")
    print("")
    
    # 3. CREATE 14 DAYS OF COMPLETIONS (realistic pattern)
    print("3️⃣ Creating habit completions (14 days)...")
    today = date.today()
    
    # Completion patterns for each habit (True = completed, False = missed)
    # Creating realistic patterns with some streaks and some misses
    completion_patterns = {
        "📚 Read 20 pages": [True, True, True, True, False, True, True, False, True, True, True, True, False, False],
        "🧘 Meditation": [True, False, True, True, False, True, True, False, True, True, True, True, False, False],
        "💪 Exercise": [True, False, True, True, False, True, True, True, True, True, True, True, False, False],
        "💧 Drink 8 glasses of water": [True, True, False, True, False, True, True, True, True, True, True, False, True, False],
        "🛌 Sleep by 11 PM": [True, True, True, True, False, True, True, False, True, True, True, True, True, False],
    }
    
    total_completions = 0
    for habit_idx, habit_name in enumerate(["📚 Read 20 pages", "🧘 Meditation", "💪 Exercise", "💧 Drink 8 glasses of water", "🛌 Sleep by 11 PM"]):
        habit_id = habit_ids[habit_idx]
        pattern = completion_patterns[habit_name]
        
        for day_offset in range(14):
            if pattern[day_offset]:
                completion_date = today - timedelta(days=14 - day_offset - 1)
                completion = Completion(
                    habit_id=habit_id,
                    user_id=user_id,
                    completed_date=completion_date
                )
                completion_dict = completion.model_dump()
                completion_dict['completed_date'] = completion_dict['completed_date'].isoformat()
                completion_dict['created_at'] = completion_dict['created_at'].isoformat()
                await db.completions.insert_one(completion_dict)
                total_completions += 1
    
    print(f"   ✅ Created {total_completions} completions")
    print("")
    
    # 4. CREATE 14 DAYS OF JOURNAL ENTRIES
    print("4️⃣ Creating journal entries (14 days)...")
    
    journal_entries = [
        {
            "content": "Today was incredibly productive. I managed to complete my reading goal and meditate for 20 minutes. I feel like I'm finally building momentum. My marathon goal feels closer than ever. If I keep this up, nothing can stop me.",
            "mood": "Happy"
        },
        {
            "content": "Skipped the gym today. Felt tired after work. I know I shouldn't make excuses but it was just one of those days. Tomorrow I'll get back on track. The reading habit is going strong though - finished another 30 pages tonight.",
            "mood": "Neutral"
        },
        {
            "content": "Meditated for the first time in weeks and honestly felt amazing. Why do I always forget how much this helps? My anxiety was through the roof yesterday but after meditation I felt calm and centered. Must make this a non-negotiable daily habit.",
            "mood": "Energized"
        },
        {
            "content": "Great workout today! Hit a new personal record on my deadlift. The marathon training is going well. I keep telling myself that consistency is the key. Read for 25 pages before bed. Drinking enough water is still a struggle though.",
            "mood": "Happy"
        },
        {
            "content": "Rough day at work. Skipped everything today - no reading, no meditation, no exercise. I hate days like this. Tomorrow is a new day and I will do better. I refuse to let one bad day break my momentum completely.",
            "mood": "Anxious"
        },
        {
            "content": "Back on track! Completed all 5 habits today. Feeling incredibly proud of myself. The streak is what keeps me going. I read about how habit stacking works and I think that's exactly what I need to implement.",
            "mood": "Happy"
        },
        {
            "content": "Thinking a lot about my goals today. The marathon is in 6 months and I need to get serious about training. My meditation practice is helping with focus. Read an amazing book chapter about discipline and long term thinking.",
            "mood": "Energized"
        },
        {
            "content": "Missed meditation again. I keep saying it's important but then I skip it when life gets busy. Exercise was great though. I need to wake up earlier to fit everything in. Sleep schedule is completely off.",
            "mood": "Neutral"
        },
        {
            "content": "Perfect day. All habits done. Meditated for 30 minutes, ran 5km, read 20 pages, drank all my water. This is what peak performance feels like. I want every day to feel like this. The marathon dream is alive!",
            "mood": "Happy"
        },
        {
            "content": "Journaling has become my favorite part of the day. It helps me process everything. Completed all habits again. Two perfect days in a row. Feeling unstoppable. My sleep has improved dramatically.",
            "mood": "Happy"
        },
        {
            "content": "Had a deep conversation with a friend about goals and accountability today. It reminded me why I started this journey. Exercise was particularly hard today but I pushed through. That's what separates the winners from the quitters.",
            "mood": "Energized"
        },
        {
            "content": "I really want to run that marathon next spring. I've been dreaming about crossing that finish line. Today's run felt effortless. Meditation is becoming second nature. I genuinely believe I can do this if I stay consistent.",
            "mood": "Energized"
        },
        {
            "content": "Tired today. Really tired. Skipped exercise and meditation. Only managed reading. I know I need to rest sometimes but I feel guilty when I miss habits. Tomorrow will be better.",
            "mood": "Neutral"
        },
        {
            "content": "Couldn't sleep last night. Skipped most habits. Feeling a bit lost today. I know what I need to do but motivation is low. I need to remember why I started all this.",
            "mood": "Anxious"
        },
    ]
    
    for day_offset, entry_data in enumerate(journal_entries):
        entry_date = today - timedelta(days=14 - day_offset - 1)
        entry = JournalEntry(
            user_id=user_id,
            content=entry_data["content"],
            mood=entry_data["mood"],
            entry_date=entry_date
        )
        entry_dict = entry.model_dump()
        entry_dict['entry_date'] = entry_dict['entry_date'].isoformat()
        entry_dict['created_at'] = entry_dict['created_at'].isoformat()
        entry_dict['updated_at'] = entry_dict['updated_at'].isoformat()
        await db.journal_entries.insert_one(entry_dict)
    
    print(f"   ✅ Created 14 journal entries")
    print("")
    
    # Summary
    print("=" * 50)
    print("✅ Demo account ready!")
    print("=" * 50)
    print(f"📧 Email: demo@dailyroutine.com")
    print(f"🔑 Password: Demo@1234")
    print(f"👤 Name: Alex Johnson")
    print(f"📚 Habits: 5 created")
    print(f"📓 Journal entries: 14 created")
    print(f"✅ Habit completions: {total_completions} created")
    print("=" * 50)
    print("")
    print("🎯 Next steps:")
    print("1. Login with demo@dailyroutine.com / Demo@1234")
    print("2. Check Dashboard to see habits and streaks")
    print("3. Visit Journal to read 14 days of entries")
    print("4. Run Accountability Check to test agents!")
    print("   (Some habits have broken streaks from last 2 days)")
    print("")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_demo_account())
