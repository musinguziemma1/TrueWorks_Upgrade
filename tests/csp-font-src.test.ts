/**
 * Bug Condition Exploration Test - CSP Font Blocking Detection
 *
 * This test validates that the Content Security Policy font-src directive
 * includes the required font domains used by the app (Google Fonts + self).
 *
 * **EXPECTED OUTCOME**: This test MUST PASS on fixed code
 * Failure confirms the bug exists - CSP blocks fonts
 */

import { readFileSync } from "fs";
import { join } from "path";

// Required font domains that MUST be in font-src directive
const REQUIRED_FONT_DOMAINS = [
  "https://fonts.gstatic.com",
] as const;

interface CSPAnalysisResult {
  fontSrcDirective: string | null;
  missingDomains: string[];
  presentDomains: string[];
  allRequiredPresent: boolean;
}

function parseCSPFontSrc(): CSPAnalysisResult {
  const configPath = join(process.cwd(), "next.config.ts");
  const configContent = readFileSync(configPath, "utf-8");

  const cspMatch = configContent.match(/"Content-Security-Policy"[^}]+value:\s*\[([\s\S]+?)\]/);

  if (!cspMatch) {
    return {
      fontSrcDirective: null,
      missingDomains: [...REQUIRED_FONT_DOMAINS],
      presentDomains: [],
      allRequiredPresent: false,
    };
  }

  const directivesStr = cspMatch[1];
  const fontSrcMatch = directivesStr.match(/"font-src[^"]*"/);

  if (!fontSrcMatch) {
    return {
      fontSrcDirective: null,
      missingDomains: [...REQUIRED_FONT_DOMAINS],
      presentDomains: [],
      allRequiredPresent: false,
    };
  }

  const fontSrcDirective = fontSrcMatch[0];
  const presentDomains: string[] = [];
  const missingDomains: string[] = [];

  for (const domain of REQUIRED_FONT_DOMAINS) {
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

console.log("=== CSP Font-SRC Bug Condition Exploration Test ===\n");
console.log("Property: Bug Condition - CSP Font Blocking Detection");
console.log("Validates: CSP preserves font loading\n");

const result = parseCSPFontSrc();

console.log("Analysis Results:");
console.log("-----------------");

if (result.fontSrcDirective) {
  console.log(`Found font-src directive: ${result.fontSrcDirective}\n`);
} else {
  console.log("ERROR: Could not find font-src directive in CSP!\n");
}

console.log("Required Font Domains Check:");
console.log("-----------------------------------");

for (const domain of REQUIRED_FONT_DOMAINS) {
  const status = result.presentDomains.includes(domain) ? "✓ PRESENT" : "✗ MISSING";
  console.log(`  ${domain}: ${status}`);
}

console.log("\n---");

if (result.allRequiredPresent) {
  console.log("\n✓ TEST PASSED: All required font domains are present in font-src directive.");
  console.log("  CSP allows the app fonts.\n");
  process.exit(0);
} else {
  console.log("\n✗ TEST FAILED: Missing font domains in font-src directive!");
  console.log("\n  Missing domains:");
  for (const domain of result.missingDomains) {
    console.log(`    - ${domain}`);
  }
  console.log("\n=== COUNTEREXAMPLE (Bug Confirmed) ===");
  console.log(`font-src directive: ${result.fontSrcDirective}`);
  console.log(`Missing domains: ${result.missingDomains.join(", ")}\n`);
  process.exit(1);
}