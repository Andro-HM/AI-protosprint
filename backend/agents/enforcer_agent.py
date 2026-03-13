"""
The Enforcer Agent - Generates ruthless personalized accountability messages
"""
from datetime import datetime, date, timedelta
from typing import Dict, Optional, List
import json
import re
import uuid


def extract_keywords(habit_name: str) -> List[str]:
    """Extract searchable keywords from habit name"""
    # Remove emojis and special chars, split into words
    words = re.findall(r'\b\w+\b', habit_name.lower())
    # Filter out common words
    stop_words = {'a', 'an', 'the', 'my', 'to', 'for', 'of', 'in', 'on'}
    return [w for w in words if w not in stop_words and len(w) > 2]


def extract_relevant_sentence(content: str, keywords: List[str]) -> str:
    """Extract the most relevant sentence containing keywords"""
    sentences = re.split(r'[.!?]+', content)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if any(kw in sentence.lower() for kw in keywords):
            # Return first 150 chars of matching sentence
            return sentence[:150] + ('...' if len(sentence) > 150 else '')
    
    return ''


def format_time_ago(dt: datetime) -> str:
    """Format datetime as human-readable time ago"""
    delta = datetime.utcnow() - dt
    
    if delta.days > 0:
        return f"{delta.days} day{'s' if delta.days != 1 else ''} ago"
    elif delta.seconds >= 3600:
        hours = delta.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    else:
        minutes = delta.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"


async def run_enforcer(user_id: str, broken_streak: Dict, db, ai_service) -> Optional[Dict]:
    """
    Generates a personalized ruthless accountability message
    
    Args:
        user_id: The user ID
        broken_streak: Dict with habit details from auditor
        db: MongoDB database connection
        ai_service: AI service instance
    
    Returns:
        Saved accountability message or None
    """
    
    # 1. Get last 7 journal entries
    journals = await db.journal_entries.find({
        "user_id": user_id
    }).sort("entry_date", -1).limit(7).to_list(7)
    
    # 2. Search for relevant content about this habit
    habit_keywords = extract_keywords(broken_streak['habit_name'])
    
    relevant_excerpt = ''
    relevant_date = ''
    
    for journal in journals:
        content = journal.get('content', '')
        if not content:
            continue
            
        content_lower = content.lower()
        is_relevant = any(kw in content_lower for kw in habit_keywords)
        
        if is_relevant:
            # Extract most relevant sentence
            relevant_excerpt = extract_relevant_sentence(content, habit_keywords)
            entry_date = journal.get('entry_date')
            if isinstance(entry_date, str):
                entry_date = datetime.fromisoformat(entry_date)
            relevant_date = format_time_ago(entry_date)
            break
    
    # 3. Build context for AI
    journal_context_parts = []
    for j in journals[:3]:
        entry_date = j.get('entry_date')
        if isinstance(entry_date, str):
            try:
                entry_date = datetime.fromisoformat(entry_date)
                date_str = entry_date.strftime('%b %d')
            except:
                date_str = str(entry_date)
        else:
            date_str = str(entry_date)
        
        content = j.get('content', '')[:200]
        journal_context_parts.append(f"[{date_str}]: {content}")
    
    journal_context = '\n\n'.join(journal_context_parts) if journal_context_parts else "No recent journal entries found."
    
    # 4. Build journal reference section
    journal_ref_section = ''
    if relevant_excerpt:
        journal_ref_section = f"""
Most relevant quote from their journal ({relevant_date}): 
"{relevant_excerpt}"
"""
    else:
        journal_ref_section = "No direct mention found in recent journals."
    
    # 5. Generate ruthless message using AI
    prompt = f"""You are a brutally honest accountability coach named "The Enforcer."
A user has broken their "{broken_streak['habit_name']}" habit streak.
They had maintained this streak for {broken_streak['previous_streak_length']} days.
It has now been {broken_streak['streak_broken_days']} days since they last did it.

Their recent journal entries:
{journal_context}

{journal_ref_section}

Write a SHORT (2-3 sentences max), highly personalized message that:
- If journal reference exists: directly call out the contradiction between what they wrote and what they did
- References their exact words if possible
- Is slightly dramatic and unhinged but ultimately caring
- Ends with ONE specific action they can take RIGHT NOW
- Never uses generic motivational quotes
- Tone: like a disappointed best friend who won't sugarcoat it

Examples of good tone:
"You missed your workout. Three days ago you wrote about wanting to run a marathon. Funny how marathons don't train themselves."

"Meditation streak: broken. Yesterday you wrote about feeling overwhelmed and anxious. The one tool that actually helps, and you skipped it. Go meditate. Right now. 5 minutes."

"{broken_streak['habit_name']} — gone. Your journal says you care about this. Your actions say otherwise. Fix that today."

Respond with ONLY a JSON object, no markdown, no code blocks:
{{"message": "the 2-3 sentence accountability message", "reasoning": "one sentence explaining what journal insight you used", "journalReference": "the specific quote or theme you referenced"}}
"""
    
    try:
        # Call AI service
        ai_response = await ai_service.generate_accountability_message(prompt)
        
        # Clean response - remove markdown code blocks if present
        ai_response = ai_response.strip()
        if ai_response.startswith('```'):
            # Remove code block markers
            lines = ai_response.split('\n')
            ai_response = '\n'.join(lines[1:-1] if lines[-1].startswith('```') else lines[1:])
        
        parsed = json.loads(ai_response)
        
        # 6. Check deduplication - only one message per habit per day
        start_of_today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing_today = await db.accountability_messages.find_one({
            "user_id": user_id,
            "habit_id": broken_streak['habit_id'],
            "created_at": {"$gte": start_of_today.isoformat()}
        })
        
        if existing_today:
            return None
        
        # 7. Save to database
        message_id = str(uuid.uuid4())
        message_doc = {
            "id": message_id,
            "user_id": user_id,
            "habit_id": broken_streak['habit_id'],
            "habit_name": broken_streak['habit_name'],
            "message": parsed.get('message', ''),
            "agent_reasoning": parsed.get('reasoning', ''),
            "journal_reference": parsed.get('journalReference', relevant_excerpt),
            "streak_broken_days": broken_streak['streak_broken_days'],
            "previous_streak_length": broken_streak['previous_streak_length'],
            "is_read": False,
            "is_dismissed": False,
            "is_resolved": False,
            "created_at": datetime.utcnow().isoformat(),
            "resolved_at": None
        }
        
        await db.accountability_messages.insert_one(message_doc)
        
        # Log enforcer action
        await db.agent_logs.insert_one({
            "id": str(uuid.uuid4()),
            "agent_name": "Enforcer",
            "user_id": user_id,
            "action": "MESSAGE_GENERATED",
            "payload": {
                "habit_name": broken_streak['habit_name'],
                "message_id": message_id
            },
            "status": "success",
            "created_at": datetime.utcnow().isoformat()
        })
        
        return message_doc
        
    except Exception as e:
        # Log failure
        await db.agent_logs.insert_one({
            "id": str(uuid.uuid4()),
            "agent_name": "Enforcer",
            "user_id": user_id,
            "action": "MESSAGE_GENERATION_FAILED",
            "payload": {
                "habit_name": broken_streak['habit_name'],
                "error": str(e)
            },
            "status": "failed",
            "created_at": datetime.utcnow().isoformat()
        })
        
        print(f"Enforcer failed to generate message: {e}")
        return None
