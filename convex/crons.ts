import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Abandoned-cart recovery emails run hourly against carts abandoned 1h+.
crons.interval(
  "send-abandoned-cart-recovery-emails",
  { hours: 1 },
  internal.cartRecovery.sendRecoveryEmails,
  {}
);

// Scheduled campaigns are released every 5 minutes when their send time hits.
crons.interval(
  "send-scheduled-campaigns",
  { minutes: 5 },
  internal.campaignScheduler.sendDueScheduled,
  {}
);

// Nightly retention: prune old analytics events, audit logs, webhook delivery
// logs, dead carts and guest carts so storage — and every read against those
// tables — stays bounded instead of growing forever.
crons.interval(
  "daily-data-retention",
  { hours: 24 },
  internal.retention.runDailyRetention,
  {}
);

export default crons;