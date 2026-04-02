const cron = require("node-cron");
const pool = require("../config/db");
const logger = require("../config/logger");

const startOtpCleanupCron = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            const result = await pool.query(`
        UPDATE otp_verifications
        SET is_used = true
        WHERE is_used = false AND expires_at < NOW()
      `);
            logger.info("[Cron] OTP cleanup done", { updated: result.rowCount });
        } catch (err) {
            logger.error("[Cron] OTP cleanup failed", { error: err.message });
        }
    });

    logger.info("[Cron] OTP cleanup job scheduled — runs every hour");
};

module.exports = { startOtpCleanupCron };
