const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./config/logger");
const { corsOptions } = require("./config/cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const shopkeeperRoutes = require("./routes/shopkeeper");
const entitlementRoutes = require("./routes/entitlement");
const beneficiaryRoutes = require("./routes/beneficiary");
const validationRoutes = require("./routes/validation");
const { verifyToken, requireRole } = require("./middleware/auth");

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Security headers
app.use(helmet());

// Auth routes — strict (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});
app.use('/auth', authLimiter);
app.use('/api/auth', authLimiter);

// All other API routes — general limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Slow down.' },
});
app.use('/api', apiLimiter);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", entitlementRoutes);
app.use("/api/shopkeeper", shopkeeperRoutes);
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/admin", validationRoutes);

app.get("/api/admin/test", verifyToken, requireRole("admin"), (req, res) => {
  return res.status(200).json({ message: "Admin route works" });
});

app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked for this origin" });
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
