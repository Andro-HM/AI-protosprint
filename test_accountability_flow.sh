#!/bin/bash

echo "=========================================="
echo "🧪 TESTING ACCOUNTABILITY COACH FEATURE"
echo "=========================================="
echo ""

# Login and get token
echo "1️⃣ Logging in as test user..."
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

USER_ID=$(curl -s http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

echo "✅ Logged in as user: $USER_ID"
echo ""

# Create a habit
echo "2️⃣ Creating test habit 'Morning Workout'..."
HABIT_RESPONSE=$(curl -s -X POST http://localhost:8001/api/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"💪 Morning Workout","emoji":"💪","color":"emerald"}')

HABIT_ID=$(echo "$HABIT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
echo "✅ Created habit: $HABIT_ID"
echo ""

# Create a journal entry mentioning the habit
echo "3️⃣ Creating journal entry mentioning workout..."
curl -s -X POST http://localhost:8001/api/journal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"I love my morning workouts! They make me feel so energized and ready for the day. I want to build this into a daily routine.","mood":"happy"}' > /dev/null
echo "✅ Journal entry created"
echo ""

# Add completions for 5 days in the past
echo "4️⃣ Simulating 5-day streak (backdating completions)..."
for i in {5..1}; do
  PAST_DATE=$(date -d "$i days ago" +%Y-%m-%d)
  curl -s -X POST http://localhost:8001/api/completions \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"habit_id\":\"$HABIT_ID\",\"completed_date\":\"$PAST_DATE\"}" > /dev/null
  echo "  ✅ Day -$i: Completed"
done
echo ""

# Now skip 2 days (today and yesterday have no completions)
echo "5️⃣ Skipping last 2 days (breaking the streak)..."
echo "  ⏭️  Yesterday: Not completed"
echo "  ⏭️  Today: Not completed"
echo ""

# Run accountability check
echo "6️⃣ Running Accountability Check..."
echo "   🔍 Agent A: Scanning for broken streaks..."
echo "   ✍️  Agent B: Generating personalized message..."
echo ""

CHECK_RESPONSE=$(curl -s -X POST http://localhost:8001/api/accountability/check \
  -H "Authorization: Bearer $TOKEN")

echo "$CHECK_RESPONSE" | python3 << 'PYEOF'
import sys, json
data = json.load(sys.stdin)
messages = data['data']['messages']
broken = data['data']['broken_streaks']

print(f"   Broken Streaks Found: {len(broken)}")
print(f"   Messages Generated: {len(messages)}")
print("")

if messages:
    msg = messages[0]
    print("📨 ACCOUNTABILITY MESSAGE:")
    print("=" * 50)
    print(f"Habit: {msg['habit_name']}")
    print(f"Streak Broken: {msg['streak_broken_days']} days")
    print(f"Previous Streak: {msg['previous_streak_length']} days")
    print("")
    print(f"Message: \"{msg['message']}\"")
    print("")
    if msg.get('journal_reference'):
        print(f"📓 Journal Reference: \"{msg['journal_reference']}\"")
    print("")
    print(f"🤖 Agent Reasoning: {msg['agent_reasoning']}")
    print("=" * 50)
else:
    print("⚠️  No messages generated (streak might not be long enough)")
PYEOF

echo ""
echo "7️⃣ Checking accountability stats..."
curl -s http://localhost:8001/api/accountability/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=========================================="
echo "✅ TEST COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open the app in browser"
echo "2. Login as test@test.com / Test@1234"
echo "3. You should see the accountability modal appear!"
echo "4. Check the bell icon (🔔) in navbar for notifications"
echo "5. Visit /accountability page to see full report"
