import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
import os
import sys

sys.path.append(str(Path(__file__).parent.parent))
from backend.models_extended import HabitCategory, HabitTemplate

load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']


async def seed_templates():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Seeding habit templates and categories...")
    
    # Clear existing
    await db.habit_categories.delete_many({})
    await db.habit_templates.delete_many({})
    
    # Categories
    categories = [
        {"name": "Health & Fitness", "description": "Physical wellness and exercise", "icon": "💪"},
        {"name": "Mindfulness", "description": "Mental health and meditation", "icon": "🧘"},
        {"name": "Learning", "description": "Education and skill development", "icon": "📚"},
        {"name": "Productivity", "description": "Work and task management", "icon": "⚡"},
        {"name": "Social", "description": "Relationships and connections", "icon": "👥"},
        {"name": "Self-Care", "description": "Personal wellness routines", "icon": "💆"},
    ]
    
    category_ids = {}
    for cat_data in categories:
        cat = HabitCategory(**cat_data)
        cat_dict = cat.model_dump()
        cat_dict['created_at'] = cat_dict['created_at'].isoformat()
        await db.habit_categories.insert_one(cat_dict)
        category_ids[cat_data['name']] = cat_dict['id']
    
    print(f"✅ Created {len(categories)} categories")
    
    # Templates
    templates = [
        # Health & Fitness
        {"category": "Health & Fitness", "name": "Morning Run", "description": "Start your day with a 30-minute run", "emoji": "🏃", "color": "#10B981"},
        {"category": "Health & Fitness", "name": "Gym Workout", "description": "Complete a full workout session", "emoji": "💪", "color": "#10B981"},
        {"category": "Health & Fitness", "name": "Drink 8 Glasses of Water", "description": "Stay hydrated throughout the day", "emoji": "💧", "color": "#0EA5E9"},
        {"category": "Health & Fitness", "name": "Healthy Breakfast", "description": "Eat a nutritious breakfast", "emoji": "🥗", "color": "#10B981"},
        {"category": "Health & Fitness", "name": "10,000 Steps", "description": "Walk at least 10,000 steps", "emoji": "👟", "color": "#10B981"},
        
        # Mindfulness
        {"category": "Mindfulness", "name": "Morning Meditation", "description": "Meditate for 10 minutes", "emoji": "🧘", "color": "#8B5CF6"},
        {"category": "Mindfulness", "name": "Gratitude Journal", "description": "Write 3 things you're grateful for", "emoji": "🙏", "color": "#8B5CF6"},
        {"category": "Mindfulness", "name": "Deep Breathing", "description": "Practice breathing exercises", "emoji": "🌬️", "color": "#0EA5E9"},
        {"category": "Mindfulness", "name": "Evening Reflection", "description": "Reflect on your day", "emoji": "🌙", "color": "#6366F1"},
        
        # Learning
        {"category": "Learning", "name": "Read 20 Pages", "description": "Read from a book", "emoji": "📚", "color": "#7C3AED"},
        {"category": "Learning", "name": "Learn New Language", "description": "Practice language for 15 minutes", "emoji": "🗣️", "color": "#7C3AED"},
        {"category": "Learning", "name": "Online Course", "description": "Complete one lesson", "emoji": "🎓", "color": "#7C3AED"},
        {"category": "Learning", "name": "Practice Instrument", "description": "Play music for 30 minutes", "emoji": "🎸", "color": "#EC4899"},
        
        # Productivity
        {"category": "Productivity", "name": "Plan Tomorrow", "description": "Review and plan next day", "emoji": "📝", "color": "#F59E0B"},
        {"category": "Productivity", "name": "Inbox Zero", "description": "Clear email inbox", "emoji": "📧", "color": "#F59E0B"},
        {"category": "Productivity", "name": "No Phone Before 9am", "description": "Avoid phone in the morning", "emoji": "📵", "color": "#EF4444"},
        {"category": "Productivity", "name": "Focus Time", "description": "2 hours of deep work", "emoji": "⚡", "color": "#F59E0B"},
        
        # Social
        {"category": "Social", "name": "Call a Friend", "description": "Connect with someone", "emoji": "📞", "color": "#EC4899"},
        {"category": "Social", "name": "Family Time", "description": "Spend quality time with family", "emoji": "👨‍👩‍👧", "color": "#EC4899"},
        {"category": "Social", "name": "Random Act of Kindness", "description": "Do something nice for someone", "emoji": "💝", "color": "#EC4899"},
        
        # Self-Care
        {"category": "Self-Care", "name": "Skin Care Routine", "description": "Complete skincare regimen", "emoji": "🧴", "color": "#06B6D4"},
        {"category": "Self-Care", "name": "Sleep by 11 PM", "description": "Get to bed on time", "emoji": "🛌", "color": "#6366F1"},
        {"category": "Self-Care", "name": "No Social Media", "description": "Take a break from socials", "emoji": "🚫", "color": "#EF4444"},
        {"category": "Self-Care", "name": "Take Vitamins", "description": "Remember daily supplements", "emoji": "💊", "color": "#10B981"},
    ]
    
    for tmpl_data in templates:
        cat_name = tmpl_data.pop('category')
        tmpl = HabitTemplate(category_id=category_ids[cat_name], **tmpl_data)
        tmpl_dict = tmpl.model_dump()
        tmpl_dict['created_at'] = tmpl_dict['created_at'].isoformat()
        await db.habit_templates.insert_one(tmpl_dict)
    
    print(f"✅ Created {len(templates)} habit templates")
    print(f"\n🎉 Template seeding complete!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_templates())
