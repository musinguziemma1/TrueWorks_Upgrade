# CSP Fix Test Suite

This directory contains property-based tests for the Endless Loading CSP Fix bugfix workflow.

## Test Overview

The test suite follows the observation-first methodology for bugfix testing:

1. **Bug Condition Exploration** (Task 1): Tests that detect the bug on unfixed code
2. **Preservation Properties** (Task 2): Tests that capture baseline behavior to preserve
3. **Fix Verification** (Task 3): Tests that verify the fix works correctly

## Running Tests

### Individual Tests

Run individual test files using ts-node:

```bash
# Bug exploration test (should FAIL on unfixed code)
npx ts-node tests/csp-font-src.test.ts

# Preservation tests (should PASS on unfixed code)
npx ts-node tests/csp-preservation.test.ts
npx ts-node tests/route-protection-preservation.test.ts
```

### All Preservation Tests

Run all preservation tests at once:

```bash
bash tests/run-all-preservation-tests.sh
```

## Test Files

### 1. Bug Condition Exploration Tests

**File**: `csp-font-src.test.ts`

**Purpose**: Detect CSP font-src directive missing required Clerk font domains

**Expected Outcome on Unfixed Code**: ✗ FAIL (confirms bug exists)

**Validates**: Requirements 2.1, 2.2, 2.5

**What it checks**:
- Clerk font domains (`https://fonts.clerk.com`, `https://*.clerk.accounts.dev`, etc.)
- Missing domains in font-src directive
- Outputs counterexample showing which domains are blocked

**Status**: ✗ FAILED (bug confirmed)
- Missing: `https://fonts.clerk.com`
- Missing: `https://*.clerk.accounts.dev`
- Missing: `https://*.clerk.dev`
- Missing: `https://*.clerk.com`

### 2. Preservation Property Tests

#### 2a. CSP Preservation Test

**File**: `csp-preservation.test.ts`

**Purpose**: Capture baseline CSP security posture to ensure no regressions after fix

**Expected Outcome on Unfixed Code**: ✓ PASS (captures baseline)

**Validates**: Requirements 3.1, 3.2, 3.3, 3.4, 3.5

**What it checks**:
- All 11 CSP directives are present (default-src, script-src, style-src, img-src, font-src, connect-src, frame-src, worker-src, object-src, base-uri, form-action)
- Third-party allowances for:
  - Stripe (script-src, frame-src, connect-src)
  - YouTube (frame-src)
  - Vimeo (frame-src)
  - Convex (connect-src with WebSocket)
  - Vercel (script-src, connect-src)
  - Google Fonts (style-src, font-src)
  - Clerk (all directives except font-src - that's the bug)
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- Security constraints (object-src='none', base-uri='self', form-action='self', default-src='self')

**Status**: ✓ PASSED (baseline captured)

#### 2b. Route Protection Preservation Test

**File**: `route-protection-preservation.test.ts`

**Purpose**: Ensure middleware route protection continues working after CSP fix

**Expected Outcome on Unfixed Code**: ✓ PASS (captures baseline)

**Validates**: Requirements 3.1, 3.2

**What it checks**:
- Clerk middleware is configured (`clerkMiddleware`)
- Public routes are defined (/, /sign-in, /sign-up, /store, etc.)
- Protection logic exists (`auth.protect()`)
- Middleware config matcher excludes static assets
- Expected public routes are present

**Status**: ✓ PASSED (baseline captured)

## Test Results Summary

### Before Fix (Current Status)

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Bug Exploration (csp-font-src) | FAIL | ✗ FAIL | ✓ Correct |
| CSP Preservation | PASS | ✓ PASS | ✓ Correct |
| Route Protection Preservation | PASS | ✓ PASS | ✓ Correct |

### After Fix (Expected)

| Test | Expected | Status |
|------|----------|--------|
| Bug Exploration (csp-font-src) | PASS | TBD |
| CSP Preservation | PASS | TBD |
| Route Protection Preservation | PASS | TBD |

## Interpretation Guide

### Bug Condition Exploration Tests

- **FAIL on unfixed code** = ✓ Good (bug confirmed)
- **PASS on unfixed code** = ✗ Bad (bug not reproduced, need to re-investigate)
- **PASS after fix** = ✓ Good (bug fixed)
- **FAIL after fix** = ✗ Bad (fix didn't work)

### Preservation Property Tests

- **PASS on unfixed code** = ✓ Good (baseline captured)
- **FAIL on unfixed code** = ✗ Bad (baseline itself has issues)
- **PASS after fix** = ✓ Good (no regression)
- **FAIL after fix** = ✗ Bad (regression introduced)

## Next Steps

1. ✓ **Task 1 Complete**: Bug condition exploration test created and run (FAILED as expected)
2. ✓ **Task 2 Complete**: Preservation tests created and run (PASSED as expected)
3. ⏳ **Task 3 Next**: Implement the CSP fix in `next.config.ts`
4. ⏳ **Task 4 Next**: Run all tests after fix to verify success and no regressions

## Property-Based Testing Notes

These tests are designed for the observation-first bugfix methodology:

1. **Observe**: Run tests on unfixed code to understand current behavior
2. **Fix**: Implement the fix based on observations
3. **Verify**: Run tests again to confirm fix works and no regressions occurred

The preservation tests capture what MUST NOT change when fixing the bug. They serve as regression tests to ensure the fix is surgical and doesn't introduce new issues.
