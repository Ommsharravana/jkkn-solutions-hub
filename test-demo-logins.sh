#!/bin/bash

# Test all 8 demo account logins
# Usage: ./test-demo-logins.sh

PASSWORD="Demo@JKKN2026"
URL="https://jkkn-solutions-hub.vercel.app/auth/login"

echo "Testing 8 Demo Account Logins"
echo "=============================="
echo ""

passed=0
failed=0

test_login() {
  local role=$1
  local email=$2
  local session="test-$role"

  echo "Testing $role ($email)..."

  # Open browser
  ~/.local/bin/browser-use -s "$session" open "$URL" --headed > /dev/null 2>&1 &
  sleep 3

  # Focus and fill email
  ~/.local/bin/browser-use -s "$session" eval "document.querySelector('#email').focus();" > /dev/null 2>&1
  ~/.local/bin/browser-use -s "$session" type "$email" > /dev/null 2>&1
  sleep 0.5

  # Focus and fill password
  ~/.local/bin/browser-use -s "$session" eval "document.querySelector('[type=password]').focus();" > /dev/null 2>&1
  ~/.local/bin/browser-use -s "$session" type "$PASSWORD" > /dev/null 2>&1
  sleep 0.5

  # Click sign in
  ~/.local/bin/browser-use -s "$session" click 5 > /dev/null 2>&1
  sleep 4

  # Check if redirected away from login page
  result=$(~/.local/bin/browser-use -s "$session" eval "window.location.href" 2>&1 | grep "result:" | cut -d: -f2-)

  if [[ "$result" == *"/auth/login"* ]]; then
    echo "  ✗ FAILED - Still on login page"
    ((failed++))
  else
    echo "  ✓ PASSED - Logged in to: $result"
    ((passed++))
  fi

  # Close session
  ~/.local/bin/browser-use -s "$session" close > /dev/null 2>&1

  sleep 1
}

test_login "md" "demo.md@jkkn.ac.in"
test_login "hod" "demo.hod@jkkn.ac.in"
test_login "staff" "demo.staff@jkkn.ac.in"
test_login "jicate" "demo.jicate@jkkn.ac.in"
test_login "builder" "demo.builder@jkkn.ac.in"
test_login "cohort" "demo.cohort@jkkn.ac.in"
test_login "production" "demo.production@jkkn.ac.in"
test_login "client" "demo.client@example.com"

echo ""
echo "=============================="
echo "Results: $passed passed, $failed failed"
echo "=============================="
