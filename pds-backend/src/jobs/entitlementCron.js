const cron = require("node-cron");
const { runEntitlementAllocation } = require("../services/entitlementService");

const startEntitlementCron = () => {
  cron.schedule(
    "0 6 1 * *",
    async () => {
      console.log(
        "[Cron] Monthly entitlement job started:",
        new Date().toISOString(),
      );

      try {
        const result = await runEntitlementAllocation();
        console.log("[Cron] Done. Cards processed:", result.processed);
      } catch (err) {
        console.error("[Cron] Entitlement job failed:", err.message);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log(
    "[Cron] Entitlement job scheduled — runs 1st of every month at 6AM IST",
  );
};

module.exports = {
  startEntitlementCron,
};
