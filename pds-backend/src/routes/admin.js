const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const {
  createRationCard,
  getRationCards,
  getBeneficiaries,
  getUsers,
  getAreas,
  getShops,
  createShopkeeper,
  getDbHealth,
} = require("../controllers/adminController");

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.post("/ration-cards", createRationCard);
router.get("/ration-cards", getRationCards);
router.get("/beneficiaries", getBeneficiaries);
router.get("/users", getUsers);
router.get("/areas", getAreas);
router.get("/shops", getShops);
router.post("/shopkeepers", createShopkeeper);
router.get("/health", getDbHealth);

module.exports = router;
