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

export default crons;