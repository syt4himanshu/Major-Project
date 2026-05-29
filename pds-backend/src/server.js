const dotenv = require("dotenv");
const app = require("./app");
const logger = require("./config/logger");
const pool = require("./config/db");
const { startEntitlementCron } = require("./jobs/entitlementCron");
const { startOtpCleanupCron } = require("./jobs/otpCleanup");

dotenv.config();

const PORT = process.env.PORT || 5000;

const ensureDatabaseGuards = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qr_sessions (
      session_id VARCHAR(150) PRIMARY KEY,
      ration_card_id UUID NOT NULL REFERENCES ration_cards(id) ON DELETE CASCADE,
      shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      issued_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      used_at TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_qr_sessions_ration_card_id
      ON qr_sessions(ration_card_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_qr_sessions_shop_id
      ON qr_sessions(shop_id);
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION prevent_admin_user_delete()
    RETURNS trigger
    AS $$
    BEGIN
      IF OLD.role = 'admin' OR LOWER(COALESCE(OLD.email, '')) = 'admin@pds.gov' THEN
        RAISE EXCEPTION 'Admin users cannot be deleted';
      END IF;

      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS trg_prevent_admin_user_delete ON users;
    CREATE TRIGGER trg_prevent_admin_user_delete
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_admin_user_delete();
  `);
};

const startServer = async () => {
  try {
    await ensureDatabaseGuards();
    startEntitlementCron();
    startOtpCleanupCron();

    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Local access: http://localhost:${PORT}`);
      }
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(
          `Port ${PORT} is already in use. Set a different PORT in your .env and restart.`,
        );
        process.exit(1);
      }

      logger.error("Server failed to start", { message: error.message });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to initialize server", { message: error.message });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

