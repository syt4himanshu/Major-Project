const express = require('express');
const { login, sendOtp, verifyOtp } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { loginSchema, otpSendSchema, otpVerifySchema } = require('../validators/auth');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/otp/send', validate(otpSendSchema), sendOtp);
router.post('/otp/verify', validate(otpVerifySchema), verifyOtp);

module.exports = router;
