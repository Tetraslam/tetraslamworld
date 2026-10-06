import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval(
  "writing publication and independent snapshots",
  { minutes: 1 },
  internal.writingSchedule.tick,
);
export default crons;
