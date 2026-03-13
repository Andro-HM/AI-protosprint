"""
Migration Script: Standardize all mood/emotion formats in database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pathlib import Path
import os
import sys
from dotenv import load_dotenv

sys.path.append(str(Path(__file__).parent.parent))
from backend.mood_utils import normalize_mood

load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL'].strip('"')
db_name = os.environ['DB_NAME'].strip('"')


async def migrate_moods():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔄 Starting mood standardization migration...")
    print("")
    
    # Get all journal entries
    entries = await db.journal_entries.find({}).to_list(10000)
    
    print(f"Found {len(entries)} journal entries to process")
    print("")
    
    updated_count = 0
    for entry in entries:
        old_mood = entry.get('mood', 'Neutral')
        new_mood = normalize_mood(old_mood)
        
        if old_mood != new_mood:
            await db.journal_entries.update_one(
                {"id": entry['id']},
                {"$set": {"mood": new_mood}}
            )
            print(f"✅ Updated: '{old_mood}' → '{new_mood}'")
            updated_count += 1
        else:
            print(f"✓ Already standardized: '{new_mood}'")
    
    print("")
    print("=" * 50)
    print(f"✅ Migration complete!")
    print(f"   Total entries: {len(entries)}")
    print(f"   Updated: {updated_count}")
    print(f"   Already standardized: {len(entries) - updated_count}")
    print("=" * 50)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_moods())
