const express = require('express');
const {
  login,
  sendOtp,
  verifyOtp,
} = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

module.exports = router;
