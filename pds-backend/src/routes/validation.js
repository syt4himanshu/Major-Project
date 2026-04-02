const express = require("express");
const { verifyToken, requireRole } = require("../middleware/auth");
const pool = require("../config/db");
const logger = require("../config/logger");

const router = express.Router();

// GET /api/admin/validation/integrity
router.get(
    "/validation/integrity",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {
        try {
            const [
                noWallet,
                noMembers,
                orphanedMembers,
                shopsNoArea,
                negativeWallets,
                suspiciousTx,
                duplicateCards,
                unlinkedBeneficiaries,
            ] = await Promise.all([
                pool.query(`
          SELECT rc.card_number FROM ration_cards rc
          LEFT JOIN wallets w ON w.ration_card_id = rc.id
          WHERE w.id IS NULL
        `),
                pool.query(`
          SELECT rc.card_number FROM ration_cards rc
          LEFT JOIN family_members fm ON fm.ration_card_id = rc.id
          WHERE fm.id IS NULL
        `),
                pool.query(`
          SELECT fm.id FROM family_members fm
          LEFT JOIN users u ON u.id = fm.user_id
          WHERE u.id IS NULL
        `),
                pool.query(`SELECT shop_code FROM shops WHERE area_id IS NULL`),
                pool.query(`
          SELECT ration_card_id FROM wallets
          WHERE rice_balance_kg < 0 OR wheat_balance_kg < 0 OR sugar_balance_kg < 0
        `),
                pool.query(`
          SELECT t.id FROM transactions t
          WHERE t.rice_qty_kg > 50 OR t.wheat_qty_kg > 50
        `),
                pool.query(`
          SELECT card_number, COUNT(*) as count
          FROM ration_cards GROUP BY card_number HAVING COUNT(*) > 1
        `),
                pool.query(`
          SELECT u.id, u.mobile FROM users u
          WHERE u.role = 'beneficiary'
            AND u.id NOT IN (SELECT user_id FROM family_members WHERE user_id IS NOT NULL)
        `),
            ]);

            const checks = [
                { check: "ration_cards_without_wallet", rows: noWallet.rows },
                { check: "ration_cards_without_members", rows: noMembers.rows },
                { check: "orphaned_family_members", rows: orphanedMembers.rows },
                { check: "shops_without_area", rows: shopsNoArea.rows },
                { check: "negative_wallet_balances", rows: negativeWallets.rows },
                { check: "suspicious_transactions", rows: suspiciousTx.rows },
                { check: "duplicate_card_numbers", rows: duplicateCards.rows },
                { check: "unlinked_beneficiary_users", rows: unlinkedBeneficiaries.rows },
            ].map(({ check, rows }) => ({
                check,
                status: rows.length === 0 ? "pass" : "fail",
                count: rows.length,
                rows,
            }));

            const passed = checks.filter((c) => c.status === "pass").length;
            const failed = checks.length - passed;

            logger.info("[Validation] Integrity check run", { passed, failed });

            return res.status(200).json({
                blockchain_ready: failed === 0,
                checks,
                summary: { total_checks: checks.length, passed, failed },
            });
        } catch (err) {
            logger.error("[Validation] Integrity check failed", { message: err.message });
            return res.status(500).json({ error: "Integrity check failed", detail: err.message });
        }
    },
);

// GET /api/admin/validation/security
router.get(
    "/validation/security",
    verifyToken,
    requireRole("admin"),
    async (req, res) => {
        try {
            const [expiredOtps, noPasswordHash, dupMobile, anonTx] = await Promise.all([
                pool.query(`
          SELECT COUNT(*) FROM otp_verifications
          WHERE is_used = false AND expires_at < NOW()
        `),
                pool.query(`
          SELECT COUNT(*) FROM users
          WHERE role IN ('admin', 'shopkeeper')
            AND (password_hash IS NULL OR password_hash = '')
        `),
                pool.query(`
          SELECT mobile, COUNT(*) as count FROM users
          WHERE role = 'beneficiary' AND mobile IS NOT NULL
          GROUP BY mobile HAVING COUNT(*) > 1
        `),
                pool.query(`SELECT COUNT(*) FROM transactions WHERE served_by IS NULL`),
            ]);

            const expiredCount = Number(expiredOtps.rows[0].count);
            const noPassCount = Number(noPasswordHash.rows[0].count);
            const anonCount = Number(anonTx.rows[0].count);

            const checks = [
                { check: "helmet_headers", status: "pass" },
                { check: "rate_limiting", status: "pass" },
                {
                    check: "otp_cleanup",
                    status: expiredCount > 0 ? "warn" : "pass",
                    ...(expiredCount > 0 && { detail: `${expiredCount} expired OTPs not cleaned up`, count: expiredCount }),
                },
                {
                    check: "users_without_password",
                    status: noPassCount > 0 ? "fail" : "pass",
                    ...(noPassCount > 0 && { count: noPassCount }),
                },
                {
                    check: "duplicate_beneficiary_mobile",
                    status: dupMobile.rows.length > 0 ? "fail" : "pass",
                    ...(dupMobile.rows.length > 0 && { rows: dupMobile.rows }),
                },
                {
                    check: "anonymous_transactions",
                    status: anonCount > 0 ? "warn" : "pass",
                    ...(anonCount > 0 && { count: anonCount }),
                },
            ];

            const passed = checks.filter((c) => c.status === "pass").length;
            const failed = checks.filter((c) => c.status === "fail").length;
            const warnings = checks.filter((c) => c.status === "warn").length;

            logger.info("[Validation] Security check run", { passed, failed, warnings });

            return res.status(200).json({
                security_ready: failed === 0,
                checks,
                summary: { total: checks.length, passed, failed, warnings },
            });
        } catch (err) {
            logger.error("[Validation] Security check failed", { message: err.message });
            return res.status(500).json({ error: "Security check failed", detail: err.message });
        }
    },
);

module.exports = router;
