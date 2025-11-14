#!/bin/bash

# Test ISPN API Authentication
# This script verifies your auth code works with the ISPN API

echo "🧪 Testing ISPN API Authentication"
echo "=================================="
echo ""

AUTH_CODE="697cecca59efe086653ae1c4194497f43d231f01"
API_URL="https://api.helpdesk.ispn.net/exec.pl"

echo "📡 Testing connection to ISPN API..."
echo "URL: $API_URL"
echo "Auth Code: ${AUTH_CODE:0:10}...${AUTH_CODE: -10}"
echo ""

# Test with listsupportsvc command (lightweight test)
echo "🔍 Sending test request (listsupportsvc)..."
RESPONSE=$(curl -s "${API_URL}?auth=${AUTH_CODE}&cmd=listsupportsvc")

echo ""
echo "📥 Response:"
echo "$RESPONSE" | head -20
echo ""

# Check for success indicators
if echo "$RESPONSE" | grep -q "<servicelist>"; then
    echo "✅ SUCCESS! Auth code is valid and API is responding correctly."
    echo ""
    echo "Your ISPN API connection is working! 🎉"
    exit 0
elif echo "$RESPONSE" | grep -qi "unauthorized\|invalid\|denied"; then
    echo "❌ FAILED! Authentication error."
    echo ""
    echo "Possible issues:"
    echo "  - Auth code may be incorrect"
    echo "  - Auth code may have expired"
    echo "  - Account may not have API access"
    echo ""
    echo "Contact your ISPN administrator for assistance."
    exit 1
else
    echo "⚠️  UNKNOWN RESPONSE"
    echo ""
    echo "The API responded but the format is unexpected."
    echo "This might still work - try the full MCP."
    exit 2
fi
