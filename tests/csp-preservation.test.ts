/**
 * Preservation Property Test - CSP Security Posture Maintained
 * 
 * This test captures baseline CSP behavior on UNFIXED code to ensure
 * no security regressions occur after implementing the fix.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * **EXPECTED OUTCOME**: This test MUST PASS on unfixed code
 * Success confirms baseline security posture to preserve after fix
 */

import { readFileSync } from "fs";
import { join } from "path";

/**
 * Baseline CSP directives that MUST remain present after fix
 * These represent the existing security posture
 */
const REQUIRED_BASE_DIRECTIVES = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "frame-src",
  "worker-src",
  "object-src",
  "base-uri",
  "form-action",
] as const;

/**
 * Third-party domains that MUST remain in their respective directives
 */
const THIRD_PARTY_ALLOWANCES = {
  stripe: {
    domains: ["https://js.stripe.com", "https://api.stripe.com"],
    requiredIn: ["script-src", "frame-src", "connect-src"],
  },
  youtube: {
    domains: ["https://www.youtube.com"],
    requiredIn: ["frame-src"],
  },
  vimeo: {
    domains: ["https://player.vimeo.com"],
    requiredIn: ["frame-src"],
  },
  convex: {
    domains: ["https://*.convex.cloud", "wss://*.convex.cloud", "https://*.convex.site"],
    requiredIn: ["connect-src"],
  },
  vercel: {
    domains: ["https://va.vercel-scripts.com", "https://*.vercel-scripts.com"],
    requiredIn: ["script-src", "connect-src"],
  },
  googleFonts: {
    domains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
    requiredIn: ["style-src", "font-src"],
  },
  clerk: {
    domains: [
      "https://*.clerk.accounts.dev",
      "https://*.clerk.dev",
      "https://*.clerk.com",
      "https://api.clerk.com",
      "https://cdn.clerk.com",
      "https://clerk-telemetry.com",
      "https://img.clerk.com",
      "https://images.clerk.dev",
    ],
    // Note: NOT checking font-src for Clerk - that's the bug we're fixing
    requiredIn: ["script-src", "style-src", "img-src", "connect-src", "frame-src", "worker-src"],
  },
} as const;

/**
 * Security headers that MUST be present and unchanged
 */
const REQUIRED_SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

/**
 * Security constraints that MUST remain enforced
 */
const SECURITY_CONSTRAINTS = {
  objectSrc: "none", // Must block plugins
  baseUri: "'self'", // Must restrict base URI
  formAction: "'self'", // Must restrict form submissions
  defaultSrc: "'self'", // Must default to same-origin
} as const;

interface PreservationTestResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  baselineSnapshot: {
    cspDirectives: Record<string, string>;
    securityHeaders: Record<string, string>;
  };
}

/**
 * Parse next.config.ts to extract CSP and security headers
 */
function parseSecurityConfiguration(): PreservationTestResult {
  const result: PreservationTestResult = {
    success: true,
    errors: [],
    warnings: [],
    baselineSnapshot: {
      cspDirectives: {},
      securityHeaders: {},
    },
  };

  try {
    // Read next.config.ts
    const configPath = join(process.cwd(), "next.config.ts");
    const configContent = readFileSync(configPath, "utf-8");

    // Extract security headers
    const securityHeadersMatch = configContent.match(
      /const securityHeaders\s*=\s*\[([\s\S]*?)\];/
    );

    if (!securityHeadersMatch) {
      result.errors.push("Could not find securityHeaders array in next.config.ts");
      result.success = false;
      return result;
    }

    const headersContent = securityHeadersMatch[1];

    // Parse CSP directive
    const cspMatch = headersContent.match(
      /"Content-Security-Policy"[^}]+value:\s*\[([\s\S]+?)\]/
    );

    if (!cspMatch) {
      result.errors.push("Could not find Content-Security-Policy in security headers");
      result.success = false;
      return result;
    }

    // Parse CSP directives into a map
    const directivesStr = cspMatch[1];
    const directiveLines = directivesStr.match(/"([^"]+)"/g) || [];

    for (const line of directiveLines) {
      const cleaned = line.replace(/"/g, "");
      const [directiveName, ...values] = cleaned.split(/\s+/);
      if (directiveName) {
        result.baselineSnapshot.cspDirectives[directiveName] = cleaned;
      }
    }

    // Parse other security headers
    const headerMatches = headersContent.matchAll(
      /\{\s*key:\s*"([^"]+)",\s*value:\s*"([^"]+)"\s*\}/g
    );

    for (const match of headerMatches) {
      const [, key, value] = match;
      if (key !== "Content-Security-Policy") {
        result.baselineSnapshot.securityHeaders[key] = value;
      }
    }

    // Perform validation checks
    validateBaseDirectives(result);
    validateThirdPartyAllowances(result);
    validateSecurityHeaders(result);
    validateSecurityConstraints(result);

    return result;
  } catch (error) {
    result.errors.push(
      `Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`
    );
    result.success = false;
    return result;
  }
}

/**
 * Validate that all base CSP directives are present
 */
function validateBaseDirectives(result: PreservationTestResult): void {
  for (const directive of REQUIRED_BASE_DIRECTIVES) {
    if (!result.baselineSnapshot.cspDirectives[directive]) {
      result.errors.push(`Missing required CSP directive: ${directive}`);
      result.success = false;
    }
  }
}

/**
 * Validate that third-party allowances are present in correct directives
 */
function validateThirdPartyAllowances(result: PreservationTestResult): void {
  for (const [serviceName, config] of Object.entries(THIRD_PARTY_ALLOWANCES)) {
    for (const directiveName of config.requiredIn) {
      const directive = result.baselineSnapshot.cspDirectives[directiveName];

      if (!directive) {
        result.errors.push(
          `Missing directive ${directiveName} required for ${serviceName}`
        );
        result.success = false;
        continue;
      }

      // Check if at least one domain from this service is present
      const hasDomain = config.domains.some((domain) => directive.includes(domain));

      if (!hasDomain) {
        // Special handling: don't fail for Clerk font-src (that's the bug)
        if (serviceName === "clerk" && directiveName === "font-src") {
          result.warnings.push(
            `Clerk domains not found in ${directiveName} (expected - this is the bug)`
          );
        } else {
          result.errors.push(
            `Third-party allowance for ${serviceName} missing in ${directiveName}. ` +
              `Expected one of: ${config.domains.join(", ")}`
          );
          result.success = false;
        }
      }
    }
  }
}

/**
 * Validate that security headers are present with correct values
 */
function validateSecurityHeaders(result: PreservationTestResult): void {
  for (const [headerName, expectedValue] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    const actualValue = result.baselineSnapshot.securityHeaders[headerName];

    if (!actualValue) {
      result.errors.push(`Missing required security header: ${headerName}`);
      result.success = false;
    } else if (actualValue !== expectedValue) {
      result.errors.push(
        `Security header ${headerName} has incorrect value. ` +
          `Expected: "${expectedValue}", Got: "${actualValue}"`
      );
      result.success = false;
    }
  }
}

/**
 * Validate that security constraints are enforced
 */
function validateSecurityConstraints(result: PreservationTestResult): void {
  const { cspDirectives } = result.baselineSnapshot;

  // Check object-src is 'none'
  if (!cspDirectives["object-src"]?.includes("'none'")) {
    result.errors.push(
      "Security constraint violated: object-src should be 'none' to block plugins"
    );
    result.success = false;
  }

  // Check base-uri is 'self'
  if (!cspDirectives["base-uri"]?.includes("'self'")) {
    result.errors.push(
      "Security constraint violated: base-uri should include 'self'"
    );
    result.success = false;
  }

  // Check form-action is 'self'
  if (!cspDirectives["form-action"]?.includes("'self'")) {
    result.errors.push(
      "Security constraint violated: form-action should include 'self'"
    );
    result.success = false;
  }

  // Check default-src is 'self'
  if (!cspDirectives["default-src"]?.includes("'self'")) {
    result.errors.push(
      "Security constraint violated: default-src should include 'self'"
    );
    result.success = false;
  }
}

// Test execution
console.log("=== CSP Preservation Property Test ===\n");
console.log("Property: Preservation - CSP Security Posture Maintained");
console.log("Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5\n");
console.log("Testing baseline security configuration BEFORE fix...\n");

const result = parseSecurityConfiguration();

// Display baseline snapshot
console.log("Baseline Security Snapshot:");
console.log("===========================\n");

console.log("CSP Directives:");
console.log("---------------");
for (const [directive, value] of Object.entries(result.baselineSnapshot.cspDirectives)) {
  console.log(`  ${directive}: ${value}`);
}

console.log("\nSecurity Headers:");
console.log("-----------------");
for (const [header, value] of Object.entries(result.baselineSnapshot.securityHeaders)) {
  console.log(`  ${header}: ${value}`);
}

// Display warnings (non-fatal)
if (result.warnings.length > 0) {
  console.log("\n⚠️  Warnings:");
  console.log("-------------");
  for (const warning of result.warnings) {
    console.log(`  - ${warning}`);
  }
}

// Display errors (fatal)
if (result.errors.length > 0) {
  console.log("\n❌ Validation Errors:");
  console.log("--------------------");
  for (const error of result.errors) {
    console.log(`  - ${error}`);
  }
}

console.log("\n---\n");

if (result.success) {
  console.log("✓ TEST PASSED: Baseline security posture captured successfully!");
  console.log("\n  This confirms:");
  console.log("  ✓ All required CSP directives are present");
  console.log("  ✓ Third-party allowances (Stripe, YouTube, Vimeo, Convex) are configured");
  console.log("  ✓ Security headers are properly set");
  console.log("  ✓ Security constraints (object-src, base-uri, form-action) are enforced");
  console.log("\n  After implementing the fix, this test should STILL PASS.");
  console.log("  If it fails after the fix, a security regression has occurred.\n");
  process.exit(0);
} else {
  console.log("✗ TEST FAILED: Baseline security validation failed!");
  console.log("\n  This indicates issues with the current security configuration.");
  console.log("  Review errors above and ensure the baseline is correct before fixing.\n");
  process.exit(1);
}
