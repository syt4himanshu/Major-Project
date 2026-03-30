const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const pool = require('../config/db');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, role, email, password_hash FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile is required' });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE mobile = $1 AND role = 'beneficiary' LIMIT 1",
      [mobile]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: mobile, channel: 'sms' });

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and otp are required' });
    }

    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: mobile, code: otp });

    if (verification.status !== 'approved') {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const result = await pool.query(
      'SELECT id, role, mobile FROM users WHERE mobile = $1 LIMIT 1',
      [mobile]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const token = signToken({
      id: user.id,
      role: user.role,
      mobile: user.mobile,
    });

    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  sendOtp,
  verifyOtp,
};
