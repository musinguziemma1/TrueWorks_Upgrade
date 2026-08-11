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

export default crons;