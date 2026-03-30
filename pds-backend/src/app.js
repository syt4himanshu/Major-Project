const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const shopkeeperRoutes = require("./routes/shopkeeper");
const entitlementRoutes = require("./routes/entitlement");
const { startEntitlementCron } = require("./jobs/entitlementCron");
const { verifyToken, requireRole } = require("./middleware/auth");
const pool = require("./config/db");

dotenv.config();

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : defaultOrigins
).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (Postman/curl) with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    // Dev convenience: allow Vite/localhost origins without constantly updating ports.
    // Keeps the allowlist strict to local development only.
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(
      origin,
    );
    if (isLocalDevOrigin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", entitlementRoutes);
app.use("/api/shopkeeper", shopkeeperRoutes);

app.get("/api/admin/test", verifyToken, requireRole("admin"), (req, res) => {
  return res.status(200).json({ message: "Admin route works" });
});

startEntitlementCron();

app.use((err, req, res, next) => {
  // Keep stack traces out of responses.
  console.error(err);

  return res.status(500).json({
    error: "Internal server error",
  });
});

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

ensureDatabaseGuards()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Set a different PORT in your .env and restart nodemon.`,
        );
        process.exit(1);
      }

      console.error("Server failed to start:", error.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database guards:", error.message);
    process.exit(1);
  });

module.exports = app;
