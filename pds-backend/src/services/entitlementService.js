const pool = require("../config/db");

const computeAllocations = async (client) => {
  const cardsResult = await client.query(`
    SELECT
      rc.id AS ration_card_id,
      rc.card_number,
      rc.category,
      COUNT(fm.id)::int AS family_size,
      MAX(w.last_reset_date) AS last_reset_date
    FROM ration_cards rc
    JOIN family_members fm ON fm.ration_card_id = rc.id
    LEFT JOIN wallets w ON w.ration_card_id = rc.id
    WHERE rc.is_active = true
    GROUP BY rc.id, rc.card_number, rc.category
    ORDER BY rc.card_number
  `);

  const policyResult = await client.query(`
    SELECT
      category,
      rice_per_person_kg,
      wheat_per_person_kg,
      sugar_per_person_kg
    FROM policies
  `);

  const policyByCategory = new Map(
    policyResult.rows.map((policy) => [policy.category, policy]),
  );

  return cardsResult.rows.map((card) => {
    const policy = policyByCategory.get(card.category);

    if (!policy) {
      throw new Error(`Policy not found for category ${card.category}`);
    }

    const familySize = Number(card.family_size);
    const riceKg =
      card.category === "AAY"
        ? 35
        : Number(policy.rice_per_person_kg) * familySize;
    const wheatKg = Number(policy.wheat_per_person_kg) * familySize;
    const sugarKg = Number(policy.sugar_per_person_kg) * familySize;

    return {
      ration_card_id: card.ration_card_id,
      card_number: card.card_number,
      category: card.category,
      family_size: familySize,
      rice_kg: Number(riceKg.toFixed(2)),
      wheat_kg: Number(wheatKg.toFixed(2)),
      sugar_kg: Number(sugarKg.toFixed(2)),
      last_reset_date: card.last_reset_date || null,
    };
  });
};

const runEntitlementAllocation = async (options = {}) => {
  const { previewOnly = false } = options;
  const client = await pool.connect();

  try {
    const allocations = await computeAllocations(client);

    console.log(`[Entitlement] Processing ${allocations.length} cards...`);

    if (!previewOnly) {
      await client.query("BEGIN");

      for (const allocation of allocations) {
        await client.query(
          `
            UPDATE wallets
            SET
              rice_balance_kg = $1,
              wheat_balance_kg = $2,
              sugar_balance_kg = $3,
              last_reset_date = CURRENT_DATE,
              updated_at = NOW()
            WHERE ration_card_id = $4
          `,
          [
            allocation.rice_kg,
            allocation.wheat_kg,
            allocation.sugar_kg,
            allocation.ration_card_id,
          ],
        );
      }

      await client.query("COMMIT");
      console.log(`[Entitlement] Done. ${allocations.length} cards updated.`);
    }

    return {
      processed: allocations.length,
      allocations,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      // Ignore rollback errors and rethrow original.
    }

    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  runEntitlementAllocation,
};
