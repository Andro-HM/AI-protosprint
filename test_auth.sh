#!/bin/bash

echo "=================================="
echo "🧪 COMPLETE AUTH FLOW TEST"
echo "=================================="
echo ""

# Generate random email to avoid conflicts
RANDOM_NUM=$RANDOM
TEST_EMAIL="test${RANDOM_NUM}@test.com"
TEST_PASSWORD="Test@1234"
TEST_NAME="Test User ${RANDOM_NUM}"

echo "📧 Test Credentials:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo ""

# Test 1: Signup
echo "1️⃣ Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "$SIGNUP_RESPONSE" | python3 -m json.tool 2>/dev/null

# Extract token
TOKEN=$(echo "$SIGNUP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Signup failed - no token received"
    exit 1
else
    echo "✅ Signup successful - Token received"
fi

echo ""
echo "2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null

LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['success'])" 2>/dev/null)

if [ "$LOGIN_SUCCESS" = "True" ]; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
    exit 1
fi

echo ""
echo "3️⃣ Testing /auth/me with token..."
ME_RESPONSE=$(curl -s http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null

ME_SUCCESS=$(echo "$ME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['success'])" 2>/dev/null)

if [ "$ME_SUCCESS" = "True" ]; then
    echo "✅ Auth verification successful"
else
    echo "❌ Auth verification failed"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ ALL AUTH TESTS PASSED!"
echo "=================================="
