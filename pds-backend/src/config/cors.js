const logger = require("./logger");

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const LOCALHOST_REGEX = /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/;
const PRIVATE_NETWORK_REGEX =
  /^http:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d{2,5})?$/;

const parseOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const buildAllowedOrigins = () => {
  const envOrigins = parseOrigins(process.env.CORS_ORIGINS);
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return envOrigins;
  }

  return Array.from(new Set([...DEFAULT_DEV_ORIGINS, ...envOrigins]));
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no Origin header (React Native, Postman, server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const isDevelopment = process.env.NODE_ENV !== "production";
    const allowAllDevOrigins = process.env.CORS_ALLOW_ALL_DEV_ORIGINS !== "false";

    // In development, allow all explicit origins unless disabled via env.
    if (isDevelopment && allowAllDevOrigins) {
      return callback(null, true);
    }

    if (
      isDevelopment &&
      (LOCALHOST_REGEX.test(origin) || PRIVATE_NETWORK_REGEX.test(origin))
    ) {
      return callback(null, true);
    }

    logger.warn("Blocked CORS origin", {
      origin,
      method: "origin-check",
      nodeEnv: process.env.NODE_ENV || "development",
      allowedOrigins,
    });

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

module.exports = {
  corsOptions,
  allowedOrigins,
};
