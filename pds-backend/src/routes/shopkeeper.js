const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  getMe,
  getBeneficiaryByRationCardId,
  dispense,
} = require("../controllers/shopkeeperController");

const router = express.Router();

router.use(verifyToken, requireRole("shopkeeper"));

router.get("/me", getMe);
router.get("/beneficiary/:id", getBeneficiaryByRationCardId);
router.post("/dispense", dispense);

module.exports = router;
