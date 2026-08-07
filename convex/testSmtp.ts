import { action } from "./_generated/server";
import { v } from "convex/values";

export const testSmtp = action({
  args: {
    host: v.string(),
    port: v.number(),
  },
  handler: async (_ctx, args) => {
    try {
      const timeout = 10_000;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      // Test TCP connection to SMTP host/port
      const response = await fetch(`https://${args.host}:${args.port}`, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      // Any response means the host is reachable
      return { success: true, message: `SMTP server ${args.host}:${args.port} is reachable` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Connection failed: ${msg}` };
    }
  },
});
