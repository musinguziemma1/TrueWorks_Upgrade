import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Cron entry point that releases every scheduled campaign whose send time has
 * arrived. Lives in its own module to avoid self-referential internal calls
 * (campaigns.ts referencing internal.campaigns.*) which break Convex type
 * inference.
 */
export const sendDueScheduled = internalAction({
  args: {},
  handler: async (_ctx): Promise<{ queued: number }> => {
    const due = await _ctx.runQuery(internal.campaigns.listDueScheduled);
    for (const c of due) {
      await _ctx.runMutation(internal.campaigns.queueSend, { id: c._id });
    }
    return { queued: due.length };
  },
});
