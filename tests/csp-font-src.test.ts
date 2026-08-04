/**
 * Bug Condition Exploration Test - CSP Font Blocking Detection
 * 
 * This test validates that the Content Security Policy font-src directive
 * includes all required Clerk font domains.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.5**
 * 
 * **EXPECTED OUTCOME**: This test MUST FAIL on unfixed code
 * Failure confirms the bug exists - CSP blocks Clerk fonts
 */

import { readFileSync } from "fs";
import { join } from "path";

// Required Clerk font domains that MUST be in font-src directive
const REQUIRED_CLERK_FONT_DOMAINS = [
  "https://fonts.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.dev",
  "https://*.clerk.com",
] as const;

interface CSPAnalysisResult {
  fontSrcDirective: string | null;
  missingDomains: string[];
  presentDomains: string[];
  allRequiredPresent: boolean;
}

/**
 * Parses the CSP header value from next.config.ts and extracts the font-src directive
 */
function parseCSPFontSrc(): CSPAnalysisResult {
  // Read next.config.ts
  const configPath = join(process.cwd(), "next.config.ts");
  const configContent = readFileSync(configPath, "utf-8");

  // Extract the Content-Security-Policy value from the security headers
  // The CSP is in the value array joined by "; "
  const cspMatch = configContent.match(/"Content-Security-Policy"[^}]+value:\s*\[([\s\S]+?)\]/);
  
  if (!cspMatch) {
    return {
      fontSrcDirective: null,
      missingDomains: [...REQUIRED_CLERK_FONT_DOMAINS],
      presentDomains: [],
      allRequiredPresent: false,
    };
  }

  // Parse the CSP directives
  const directivesStr = cspMatch[1];
  
  // Extract font-src directive
  // Match the font-src directive - it's a string in the array
  const fontSrcMatch = directivesStr.match(/"font-src[^"]*"/);
  
  if (!fontSrcMatch) {
    return {
      fontSrcDirective: null,
      missingDomains: [...REQUIRED_CLERK_FONT_DOMAINS],
      presentDomains: [],
      allRequiredPresent: false,
    };
  }

  const fontSrcDirective = fontSrcMatch[0];
  
  // Check which required domains are present/missing
  const presentDomains: string[] = [];
  const missingDomains: string[] = [];

  for (const domain of REQUIRED_CLERK_FONT_DOMAINS) {
    // For wildcard domains, we need to check if the base pattern exists
    // *.clerk.accounts.dev should match the literal string in the CSP
    if (fontSrcDirective.includes(domain)) {
      presentDomains.push(domain);
    } else {
      missingDomains.push(domain);
    }
  }

  return {
    fontSrcDirective,
    missingDomains,
    presentDomains,
    allRequiredPresent: missingDomains.length === 0,
  };
}

// Test execution
console.log("=== CSP Font-SRC Bug Condition Exploration Test ===\n");
console.log("Property: Bug Condition - CSP Font Blocking Detection");
console.log("Validates: Requirements 2.1, 2.2, 2.5\n");

const result = parseCSPFontSrc();

console.log("Analysis Results:");
console.log("-----------------");

if (result.fontSrcDirective) {
  console.log(`Found font-src directive: ${result.fontSrcDirective}\n`);
} else {
  console.log("ERROR: Could not find font-src directive in CSP!\n");
}

console.log("Required Clerk Font Domains Check:");
console.log("-----------------------------------");

for (const domain of REQUIRED_CLERK_FONT_DOMAINS) {
  const status = result.presentDomains.includes(domain) ? "✓ PRESENT" : "✗ MISSING";
  console.log(`  ${domain}: ${status}`);
}

console.log("\n---");

if (result.allRequiredPresent) {
  console.log("\n✓ TEST PASSED: All required Clerk font domains are present in font-src directive.");
  console.log("  This means the bug condition does NOT exist - CSP allows Clerk fonts.\n");
  process.exit(0);
} else {
  console.log("\n✗ TEST FAILED: Missing Clerk font domains in font-src directive!");
  console.log("\n  Missing domains:");
  for (const domain of result.missingDomains) {
    console.log(`    - ${domain}`);
  }
  console.log("\n  This confirms the BUG EXISTS:");
  console.log("  - CSP will block Clerk fonts from loading");
  console.log("  - Application may show endless loading or blank page");
  console.log("  - Browser console will show CSP violation errors\n");
  
  // Output counterexample for PBT status update
  console.log("=== COUNTEREXAMPLE (Bug Confirmed) ===");
  console.log(`font-src directive: ${result.fontSrcDirective}`);
  console.log(`Missing domains: ${result.missingDomains.join(", ")}\n`);
  
  process.exit(1);
}
