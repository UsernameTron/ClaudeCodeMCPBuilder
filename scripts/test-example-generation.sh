#!/bin/bash

# End-to-End Test Script for MCP Builder
# Tests server generation with different configurations

set -e  # Exit on error

echo "🧪 Running E2E Tests for MCP Builder"
echo "====================================="

# Create temporary test directory
TEST_DIR=$(mktemp -d)
echo "📁 Test directory: $TEST_DIR"

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up test directory..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test that should succeed
run_test() {
  local test_name="$1"
  local server_name="$2"
  shift 2
  local args="$@"

  echo ""
  echo "▶️  Test: $test_name"
  echo "   Command: npm run create-server -- --name $server_name $args --output $TEST_DIR"

  if npm run create-server -- --name "$server_name" $args --output "$TEST_DIR" > /dev/null 2>&1; then
    echo "   ✅ Generation successful"

    # Verify basic structure
    local server_path="$TEST_DIR/$server_name"
    if [ -f "$server_path/package.json" ] && \
       [ -f "$server_path/tsconfig.json" ] && \
       [ -f "$server_path/src/index.ts" ] && \
       [ -f "$server_path/README.md" ]; then
      echo "   ✅ File structure valid"
      TESTS_PASSED=$((TESTS_PASSED + 1))
      return 0
    else
      echo "   ❌ Missing required files"
      TESTS_FAILED=$((TESTS_FAILED + 1))
      return 1
    fi
  else
    echo "   ❌ Generation failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Function to test that invalid configs are rejected
run_validation_test() {
  local test_name="$1"
  local server_name="$2"
  shift 2
  local args="$@"

  echo ""
  echo "▶️  Test: $test_name (should fail validation)"
  echo "   Command: npm run create-server -- --name $server_name $args --output $TEST_DIR"

  if npm run create-server -- --name "$server_name" $args --output "$TEST_DIR" > /dev/null 2>&1; then
    echo "   ❌ Generation succeeded (should have failed)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  else
    echo "   ✅ Validation correctly rejected invalid config"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  fi
}

# Test 1: Tools server
run_test "Tools Server" "test-tools-server" "--type tools"

# Test 2: Resources server
run_test "Resources Server" "test-resources-server" "--type resources"

# Test 3: Prompts server
run_test "Prompts Server" "test-prompts-server" "--type prompts"

# Test 4: Mixed server
run_test "Mixed Server" "test-mixed-server" "--type mixed"

# Test 5: Validation - Server without examples should fail
run_validation_test "Invalid Config - No Examples" "test-no-examples" "--type tools --no-examples"

# Test 6: Server without tests
run_test "Server Without Tests" "test-no-tests" "--type tools --no-tests"

# Test 7: Verify capability validation prevents invalid configs
echo ""
echo "▶️  Test: Invalid Configuration (No Capabilities)"
if npm run create-server -- --name test-invalid --type tools --no-examples --output "$TEST_DIR" --skip-install > /dev/null 2>&1; then
  echo "   ❌ Should have failed validation"
  TESTS_FAILED=$((TESTS_FAILED + 1))
else
  echo "   ✅ Correctly rejected invalid configuration"
  TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# Summary
echo ""
echo "====================================="
echo "📊 Test Results"
echo "====================================="
echo "✅ Passed: $TESTS_PASSED"
echo "❌ Failed: $TESTS_FAILED"
echo "📈 Total:  $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo "🎉 All E2E tests passed!"
  exit 0
else
  echo ""
  echo "💔 Some E2E tests failed"
  exit 1
fi
