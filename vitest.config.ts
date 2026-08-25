import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Convex functions are tested with convex-test inside the edge runtime,
    // per the guidelines in convex/_generated/ai/guidelines.md.
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts"],
  },
});
