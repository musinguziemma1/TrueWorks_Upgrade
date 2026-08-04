# Run all tests for CSP fix (exploration + preservation)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CSP Fix Test Suite - Complete Run" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Track overall result
$overallResult = 0

# Phase 1: Bug Exploration
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "PHASE 1: Bug Condition Exploration" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "These tests SHOULD FAIL on unfixed code" -ForegroundColor Gray
Write-Host "(failure confirms the bug exists)" -ForegroundColor Gray
Write-Host ""

npx ts-node tests/csp-font-src.test.ts
$explorationResult = $LASTEXITCODE
Write-Host ""

# Phase 2: Preservation
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "PHASE 2: Preservation Properties" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "These tests SHOULD PASS on unfixed code" -ForegroundColor Gray
Write-Host "(captures baseline behavior to preserve)" -ForegroundColor Gray
Write-Host ""

npx ts-node tests/csp-preservation.test.ts
$preservation1Result = $LASTEXITCODE
Write-Host ""

npx ts-node tests/route-protection-preservation.test.ts
$preservation2Result = $LASTEXITCODE
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Bug Exploration Tests:" -ForegroundColor White
Write-Host "----------------------" -ForegroundColor White
if ($explorationResult -ne 0) {
    Write-Host "Checkmark CSP Font-Src Test: FAILED - as expected - bug confirmed" -ForegroundColor Green
} else {
    Write-Host "Warning CSP Font-Src Test: PASSED - unexpected - bug not reproduced!" -ForegroundColor Red
    $overallResult = 1
}
Write-Host ""

Write-Host "Preservation Tests:" -ForegroundColor White
Write-Host "-------------------" -ForegroundColor White
if ($preservation1Result -eq 0) {
    Write-Host "Checkmark CSP Preservation: PASSED - baseline captured" -ForegroundColor Green
} else {
    Write-Host "X CSP Preservation: FAILED - baseline has issues" -ForegroundColor Red
    $overallResult = 1
}

if ($preservation2Result -eq 0) {
    Write-Host "Checkmark Route Protection: PASSED - baseline captured" -ForegroundColor Green
} else {
    Write-Host "X Route Protection: FAILED - baseline has issues" -ForegroundColor Red
    $overallResult = 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($overallResult -eq 0) {
    Write-Host "Checkmark All Tests Behaved As Expected!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to implement CSP fix:" -ForegroundColor Green
    Write-Host "  1. Bug confirmed (font-src missing Clerk domains)" -ForegroundColor Gray
    Write-Host "  2. Baseline security captured (preservation tests)" -ForegroundColor Gray
    Write-Host "  3. Next step: Implement fix in next.config.ts" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After implementing fix, run this script again." -ForegroundColor Yellow
    Write-Host "Expected results after fix:" -ForegroundColor Yellow
    Write-Host "  - Bug Exploration: PASS (bug fixed)" -ForegroundColor Gray
    Write-Host "  - Preservation Tests: PASS (no regression)" -ForegroundColor Gray
} else {
    Write-Host "Warning Test Results Need Review!" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Some tests did not behave as expected." -ForegroundColor Red
    Write-Host "Review errors above before proceeding." -ForegroundColor Red
}

exit $overallResult
