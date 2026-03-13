"""
Agent Orchestrator - Coordinates Auditor and Enforcer agents
"""
from typing import List, Dict
import asyncio
from .auditor_agent import run_auditor
from .enforcer_agent import run_enforcer


async def run_accountability_check(user_id: str, db, ai_service) -> Dict:
    """
    Runs the complete accountability check pipeline
    
    Args:
        user_id: The user to check
        db: MongoDB database connection
        ai_service: AI service instance
    
    Returns:
        Dict with messages and broken_streaks
    """
    try:
        # Step 1: Agent A scans for broken streaks
        print(f'🔍 Agent A (Auditor) scanning for user {user_id}...')
        broken_streaks = await run_auditor(user_id, db)
        
        if not broken_streaks:
            print('✅ No broken streaks found')
            return {
                "messages": [],
                "broken_streaks": []
            }
        
        print(f'⚠️  Found {len(broken_streaks)} broken streaks')
        
        # Step 2: Agent B generates message for each
        messages = []
        for streak in broken_streaks:
            print(f'✍️  Agent B (Enforcer) generating for: {streak["habit_name"]}')
            
            message = await run_enforcer(user_id, streak, db, ai_service)
            if message:
                messages.append(message)
            
            # Small delay between API calls to avoid rate limiting
            await asyncio.sleep(0.5)
        
        print(f'📨 Generated {len(messages)} accountability messages')
        
        return {
            "messages": messages,
            "broken_streaks": broken_streaks
        }
        
    except Exception as error:
        print(f'❌ Agent orchestration failed: {error}')
        return {
            "messages": [],
            "broken_streaks": [],
            "error": str(error)
        }
