#!/bin/bash
# Run all preservation property tests
# These tests capture baseline behavior BEFORE implementing fix

echo "=========================================="
echo "Running Preservation Property Tests"
echo "=========================================="
echo ""
echo "These tests capture baseline CSP and route protection"
echo "behavior on UNFIXED code. All tests should PASS."
echo ""
echo "After implementing the CSP fix, run these again to"
echo "ensure no security regressions occurred."
echo ""

# Track overall result
OVERALL_RESULT=0

# Test 1: CSP Preservation
echo "==========================================  "
echo "Test 1: CSP Preservation"
echo "=========================================="
npx ts-node tests/csp-preservation.test.ts
CSP_RESULT=$?
if [ $CSP_RESULT -ne 0 ]; then
  OVERALL_RESULT=1
fi
echo ""

# Test 2: Route Protection Preservation
echo "=========================================="
echo "Test 2: Route Protection Preservation"
echo "=========================================="
npx ts-node tests/route-protection-preservation.test.ts
ROUTE_RESULT=$?
if [ $ROUTE_RESULT -ne 0 ]; then
  OVERALL_RESULT=1
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""

if [ $CSP_RESULT -eq 0 ]; then
  echo "✓ CSP Preservation Test: PASSED"
else
  echo "✗ CSP Preservation Test: FAILED"
fi

if [ $ROUTE_RESULT -eq 0 ]; then
  echo "✓ Route Protection Test: PASSED"
else
  echo "✗ Route Protection Test: FAILED"
fi

echo ""
if [ $OVERALL_RESULT -eq 0 ]; then
  echo "=========================================="
  echo "All Preservation Tests PASSED!"
  echo "=========================================="
  echo ""
  echo "Baseline security posture captured successfully."
  echo "You can now proceed to implement the CSP fix."
  echo "After the fix, run these tests again to ensure"
  echo "no security regressions occurred."
else
  echo "=========================================="
  echo "Some Preservation Tests FAILED!"
  echo "=========================================="
  echo ""
  echo "Review errors above before proceeding with fix."
fi

exit $OVERALL_RESULT
