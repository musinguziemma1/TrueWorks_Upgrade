# Implementation Plan

## Overview

This plan fixes the CSP `font-src` directive to allow Clerk font domains, resolving the endless loading bug.

**Bug Condition**: CSP blocks Clerk fonts when loading from `fonts.clerk.com`, `*.clerk.accounts.dev`, `*.clerk.dev`, or `*.clerk.com`

**Expected Behavior**: All Clerk fonts load successfully, application renders without CSP violations

**Preservation**: Existing security posture, route protection, and third-party integrations remain unchanged

---

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - CSP Font Blocking Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate CSP blocks Clerk font domains
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: font-src directive missing Clerk domains
  - Test implementation: Read `next.config.ts`, parse CSP header, verify `font-src` contains all required Clerk font domains:
    - `https://fonts.clerk.com`
    - `https://*.clerk.accounts.dev`
    - `https://*.clerk.dev`
    - `https://*.clerk.com`
  - The test assertions should match Expected Behavior from design: CSP allows all required Clerk font domains
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: which Clerk font domains are missing from font-src
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - CSP Security Posture Maintained
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: On unfixed code, existing CSP directives work correctly (script-src, connect-src, frame-src, etc.)
  - Observe: On unfixed code, security headers are present (X-Frame-Options, X-Content-Type-Options, etc.)
  - Write property-based tests capturing:
    - All existing CSP directives remain present after fix
    - Security headers (X-Frame-Options, X-Content-Type-Options, etc.) are unchanged
    - Third-party allowances (Stripe, YouTube, Vimeo) remain in their respective directives
    - Route protection behavior is unchanged (middleware still redirects unauthenticated users)
  - Property-based testing generates assertions across all security headers
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for missing Clerk font domains in CSP font-src directive

  - [x] 3.1 Implement the fix
    - Update `next.config.ts` securityHeaders array
    - Modify the `font-src` directive from:
      ```
      "font-src 'self' https://fonts.gstatic.com"
      ```
      to:
      ```
      "font-src 'self' https://fonts.gstatic.com https://fonts.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com"
      ```
    - Add the following Clerk font domains:
      - `https://fonts.clerk.com` - Clerk's primary font hosting
      - `https://*.clerk.accounts.dev` - Clerk account domain fonts
      - `https://*.clerk.dev` - Clerk development domain fonts
      - `https://*.clerk.com` - Clerk production domain fonts
    - _Bug_Condition: isBugCondition(input) where input.resourceType = "font" AND input.resourceDomain IN ["fonts.clerk.com", "*.clerk.accounts.dev", "*.clerk.dev", "*.clerk.com"]_
    - _Expected_Behavior: CSP font-src directive includes all Clerk font domains, enabling successful font loading_
    - _Preservation: Existing CSP directives unchanged, security headers maintained, route protection intact_
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - CSP Allows Clerk Font Domains
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - CSP Security Posture Maintained
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify in browser:
    - Application loads without blank white page
    - Browser console shows no CSP font-src violations
    - Clerk authentication UI renders correctly
    - Convex WebSocket connects successfully
