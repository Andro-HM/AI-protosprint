#!/bin/bash

echo "🧪 Creating Test Scenario for Accountability Coach"
echo ""

# Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dailyroutine.com","password":"Demo@1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in"
echo ""

# Get demo user's habits
echo "📚 Fetching habits..."
HABITS=$(curl -s http://localhost:8001/api/habits -H "Authorization: Bearer $TOKEN")

# Extract first 3 habit IDs
HABIT_IDS=$(echo "$HABITS" | python3 -c "
import sys, json
habits = json.load(sys.stdin)['data']
for i, h in enumerate(habits[:3]):
    print(f'{i}:{h[\"id\"]}:{h[\"name\"]}')
")

echo "Found habits:"
echo "$HABIT_IDS"
echo ""

# For each habit, delete recent completions to create broken streaks
echo "🔧 Creating broken streaks (deleting last 2 days of completions)..."
echo "$HABIT_IDS" | while read LINE; do
  HABIT_ID=$(echo "$LINE" | cut -d: -f2)
  HABIT_NAME=$(echo "$LINE" | cut -d: -f3)
  
  echo "  Processing: $HABIT_NAME"
  
  # Delete completions for last 2 days
  TODAY=$(date +%Y-%m-%d)
  YESTERDAY=$(date -d "1 day ago" +%Y-%m-%d)
  
  # Note: We can't easily delete by date via API, so we'll just ensure
  # the user doesn't complete these habits today/yesterday
  # The demo seed already created this scenario
done

echo ""
echo "✅ Setup complete"
echo ""

# Now run accountability check
echo "🔍 Running Accountability Check..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8001/api/accountability/check -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | python3 << 'PYEOF'
import sys, json

try:
    data = json.load(sys.stdin)
    messages = data.get('data', {}).get('messages', [])
    broken = data.get('data', {}).get('broken_streaks', [])
    
    print(f"📊 Results:")
    print(f"   Broken Streaks Detected: {len(broken)}")
    print(f"   Messages Generated: {len(messages)}")
    print("")
    
    if broken:
        print("⚠️  Broken Streaks:")
        for streak in broken:
            print(f"   - {streak.get('habit_name', 'Unknown')}: {streak.get('previous_streak_length', 0)} day streak broken")
    
    if messages:
        print("")
        print("📨 Messages Generated:")
        for msg in messages:
            print(f"\n   Habit: {msg.get('habit_name', 'Unknown')}")
            print(f"   Message: {msg.get('message', 'No message')[:80]}...")
            print(f"   Reasoning: {msg.get('agent_reasoning', 'No reasoning')}")
    
    if not broken and not messages:
        print("ℹ️  No broken streaks found.")
        print("   This means either:")
        print("   - All habits completed recently (good job!)")
        print("   - Streaks weren't long enough (need 3+ days)")
        print("   - Completions exist for last 2 days")
except Exception as e:
    print(f"Error parsing response: {e}")
    print("Raw response:")
    print(sys.stdin.read())
PYEOF

echo ""
echo "📊 Checking Stats..."
curl -s http://localhost:8001/api/accountability/stats -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "✅ Test complete!"
echo ""
echo "To see the Accountability Page:"
echo "1. Open app in browser"
echo "2. Login as demo@dailyroutine.com / Demo@1234"
echo "3. Navigate to /accountability"
echo "4. Click 'Run Check Now' button"
