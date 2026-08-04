#!/bin/bash
# Run all tests for CSP fix (exploration + preservation)

echo "=========================================="
echo "CSP Fix Test Suite - Complete Run"
echo "=========================================="
echo ""

# Track overall result
OVERALL_RESULT=0

# Phase 1: Bug Exploration
echo "=========================================="
echo "PHASE 1: Bug Condition Exploration"
echo "=========================================="
echo ""
echo "These tests SHOULD FAIL on unfixed code"
echo "(failure confirms the bug exists)"
echo ""

npx ts-node tests/csp-font-src.test.ts
EXPLORATION_RESULT=$?
echo ""

# Phase 2: Preservation
echo "=========================================="
echo "PHASE 2: Preservation Properties"
echo "=========================================="
echo ""
echo "These tests SHOULD PASS on unfixed code"
echo "(captures baseline behavior to preserve)"
echo ""

npx ts-node tests/csp-preservation.test.ts
PRESERVATION1_RESULT=$?
echo ""

npx ts-node tests/route-protection-preservation.test.ts
PRESERVATION2_RESULT=$?
echo ""

# Summary
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo ""

echo "Bug Exploration Tests:"
echo "----------------------"
if [ $EXPLORATION_RESULT -ne 0 ]; then
  echo "✓ CSP Font-Src Test: FAILED (as expected - bug confirmed)"
else
  echo "⚠ CSP Font-Src Test: PASSED (unexpected - bug not reproduced!)"
  OVERALL_RESULT=1
fi
echo ""

echo "Preservation Tests:"
echo "-------------------"
if [ $PRESERVATION1_RESULT -eq 0 ]; then
  echo "✓ CSP Preservation: PASSED (baseline captured)"
else
  echo "✗ CSP Preservation: FAILED (baseline has issues)"
  OVERALL_RESULT=1
fi

if [ $PRESERVATION2_RESULT -eq 0 ]; then
  echo "✓ Route Protection: PASSED (baseline captured)"
else
  echo "✗ Route Protection: FAILED (baseline has issues)"
  OVERALL_RESULT=1
fi

echo ""
echo "=========================================="
if [ $OVERALL_RESULT -eq 0 ]; then
  echo "✓ All Tests Behaved As Expected!"
  echo "=========================================="
  echo ""
  echo "Ready to implement CSP fix:"
  echo "  1. Bug confirmed (font-src missing Clerk domains)"
  echo "  2. Baseline security captured (preservation tests)"
  echo "  3. Next step: Implement fix in next.config.ts"
  echo ""
  echo "After implementing fix, run this script again."
  echo "Expected results after fix:"
  echo "  - Bug Exploration: PASS (bug fixed)"
  echo "  - Preservation Tests: PASS (no regression)"
else
  echo "⚠ Test Results Need Review!"
  echo "=========================================="
  echo ""
  echo "Some tests didn't behave as expected."
  echo "Review errors above before proceeding."
fi

exit $OVERALL_RESULT
