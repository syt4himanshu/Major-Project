const bcrypt = require("bcrypt");
const pool = require("../config/db");
const logger = require("../config/logger");

const ALLOWED_CATEGORIES = ["APL", "BPL", "AAY"];

const createRationCard = async (req, res, next) => {

  const client = await pool.connect();

  try {
    const { card_number, category, shop_id, head, members = [] } = req.body;

    if (!card_number || !category || !shop_id || !head || !Array.isArray(members)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category. Allowed: APL, BPL, AAY" });
    }

    if (!head.name || typeof head.age !== "number" || !head.mobile) {
      return res.status(400).json({ error: "Invalid head details" });
    }

    await client.query("BEGIN");

    const existingCardResult = await client.query(
      "SELECT id FROM ration_cards WHERE card_number = $1 LIMIT 1",
      [card_number],
    );
    if (existingCardResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "card_number already exists" });
    }

    const shopExistsResult = await client.query(
      "SELECT id FROM shops WHERE id = $1 LIMIT 1",
      [shop_id],
    );
    if (shopExistsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid shop_id" });
    }

    const mobileExistsResult = await client.query(
      "SELECT id FROM users WHERE mobile = $1 LIMIT 1",
      [head.mobile],
    );
    if (mobileExistsResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Head mobile already exists" });
    }

    const policyResult = await client.query(
      `SELECT rice_per_person_kg, wheat_per_person_kg, sugar_per_person_kg
       FROM policies WHERE category = $1 LIMIT 1`,
      [category],
    );
    if (policyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Policy not found for category ${category}` });
    }
    const policy = policyResult.rows[0];

    const headUserResult = await client.query(
      "INSERT INTO users (role, mobile) VALUES ('beneficiary', $1) RETURNING id",
      [head.mobile],
    );
    const headUserId = headUserResult.rows[0].id;

    const shopAreaResult = await client.query(
      "SELECT area_id FROM shops WHERE id = $1 LIMIT 1",
      [shop_id],
    );
    const areaId = shopAreaResult.rows[0].area_id;

    const rationCardResult = await client.query(
      `INSERT INTO ration_cards (card_number, category, head_user_id, shop_id, area_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, card_number`,
      [card_number, category, headUserId, shop_id, areaId],
    );
    const rationCard = rationCardResult.rows[0];

    await client.query(
      `INSERT INTO family_members (ration_card_id, user_id, name, age, is_head)
       VALUES ($1, $2, $3, $4, true)`,
      [rationCard.id, headUserId, head.name, head.age],
    );

    for (const member of members) {
      if (!member.name || typeof member.age !== "number") {
        throw new Error("Invalid member details");
      }
      const memberUserResult = await client.query(
        "INSERT INTO users (role, mobile) VALUES ('beneficiary', NULL) RETURNING id",
      );
      const memberUserId = memberUserResult.rows[0].id;
      await client.query(
        `INSERT INTO family_members (ration_card_id, user_id, name, age, is_head)
         VALUES ($1, $2, $3, $4, false)`,
        [rationCard.id, memberUserId, member.name, member.age],
      );
    }

    const totalMembers = 1 + members.length;
    const riceBalance = Number(policy.rice_per_person_kg) * totalMembers;
    const wheatBalance = Number(policy.wheat_per_person_kg) * totalMembers;
    const sugarBalance = Number(policy.sugar_per_person_kg) * totalMembers;

    await client.query(
      `INSERT INTO wallets (ration_card_id, rice_balance_kg, wheat_balance_kg, sugar_balance_kg)
       VALUES ($1, $2, $3, $4)`,
      [rationCard.id, riceBalance, wheatBalance, sugarBalance],
    );

    await client.query("COMMIT");

    logger.info('Ration card created', { card_number, members_created: totalMembers });

    return res.status(201).json({
      ration_card: { id: rationCard.id, card_number: rationCard.card_number },
      members_created: totalMembers,
      wallet: {
        rice_balance_kg: Number(riceBalance.toFixed(2)),
        wheat_balance_kg: Number(wheatBalance.toFixed(2)),
        sugar_balance_kg: Number(sugarBalance.toFixed(2)),
      },
    });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) { }
    return res.status(500).json({ error: error.message || "Failed to create ration card" });
  } finally {
    client.release();
  }
};

const getBeneficiaries = async (req, res, next) => {
  try {
    const { category, area_id, shop_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const params = [];
    const filters = [];

    if (category) { params.push(category); filters.push(`rc.category = $${params.length}`); }
    if (area_id) { params.push(area_id); filters.push(`rc.area_id = $${params.length}`); }
    if (shop_id) { params.push(shop_id); filters.push(`rc.shop_id = $${params.length}`); }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ration_cards rc ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `SELECT
         fm_head.name,
         u.mobile,
         rc.card_number,
         rc.category,
         s.shop_name,
         a.name AS area_name,
         (SELECT COUNT(*) FROM family_members fm_c WHERE fm_c.ration_card_id = rc.id)::int AS family_size
       FROM ration_cards rc
       INNER JOIN family_members fm_head ON fm_head.ration_card_id = rc.id AND fm_head.is_head = true
       INNER JOIN users u  ON u.id  = fm_head.user_id
       INNER JOIN shops s  ON s.id  = rc.shop_id
       INNER JOIN areas a  ON a.id  = rc.area_id
       ${whereClause}
       ORDER BY rc.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getRationCards = async (req, res, next) => {

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM ration_cards`);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT rc.id, rc.card_number, rc.category, rc.created_at,
              rc.head_user_id, rc.shop_id, rc.area_id,
              u.mobile AS head_mobile,
              s.shop_name,
              a.name AS area_name
       FROM ration_cards rc
       LEFT JOIN users u ON u.id = rc.head_user_id
       LEFT JOIN shops s ON s.id = rc.shop_id
       LEFT JOIN areas a ON a.id = rc.area_id
       ORDER BY rc.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getDbHealth = async (req, res, next) => {
  console.log("Hit GET /api/admin/health");

  const neededTables = ["areas", "shops", "users", "ration_cards", "family_members", "wallets"];

  try {
    const checks = await Promise.all(
      neededTables.map(async (table) => {
        const result = await pool.query(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = $1
           ) AS exists`,
          [table],
        );
        return { table, exists: result.rows[0].exists };
      }),
    );
    return res.status(200).json({ status: "ok", checks });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const params = [];
    let whereClause = "";

    if (role) {
      params.push(role);
      whereClause = `WHERE role = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    const nameColumnResult = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'name' LIMIT 1`,
    );
    const nameSelect = nameColumnResult.rows.length > 0 ? "name" : "NULL::varchar AS name";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `SELECT id, role, ${nameSelect}, email, mobile, is_active
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getAreas = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.name,
        COUNT(DISTINCT s.id)::int AS shop_count,
        COUNT(DISTINCT s.shopkeeper_id)::int AS shopkeeper_count,
        COUNT(DISTINCT fm.id)::int AS beneficiary_count
      FROM areas a
      LEFT JOIN shops s ON s.area_id = a.id
      LEFT JOIN ration_cards rc ON rc.area_id = a.id
      LEFT JOIN family_members fm ON fm.ration_card_id = rc.id AND fm.is_head = true
      GROUP BY a.id, a.name
      ORDER BY a.name ASC
    `);
    return res.status(200).json({ areas: result.rows });
  } catch (error) {
    return next(error);
  }
};

const getShops = async (req, res, next) => {
  try {
    const { area_id } = req.query;
    const unassigned = req.query.unassigned === "true";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (unassigned) {
      const result = await pool.query(
        `SELECT s.id, s.shop_name, s.shop_code, a.name as area_name
         FROM shops s
         JOIN areas a ON s.area_id = a.id
         WHERE s.shopkeeper_id IS NULL
         ORDER BY a.name, s.shop_name`,
      );
      return res.status(200).json({ shops: result.rows });
    }

    const filterParams = [];
    let whereClause = "";
    if (area_id) {
      filterParams.push(area_id);
      whereClause = `WHERE s.area_id = $${filterParams.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM shops s ${whereClause}`,
      filterParams,
    );
    const total = parseInt(countResult.rows[0].count);

    filterParams.push(limit);
    const limitIdx = filterParams.length;
    filterParams.push(offset);
    const offsetIdx = filterParams.length;

    const result = await pool.query(
      `SELECT
         s.id,
         s.shop_code,
         s.shop_name,
         a.name AS area_name,
         COALESCE(split_part(sk.email, '@', 1), NULL) AS shopkeeper_name,
         sk.mobile AS shopkeeper_mobile,
         COUNT(DISTINCT rc.id)::int AS beneficiary_count
       FROM shops s
       INNER JOIN areas a ON a.id = s.area_id
       LEFT JOIN users sk ON sk.id = s.shopkeeper_id
       LEFT JOIN ration_cards rc ON rc.shop_id = s.id
       ${whereClause}
       GROUP BY s.id, s.shop_code, s.shop_name, a.name, sk.email, sk.mobile
       ORDER BY s.shop_code ASC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      filterParams,
    );

    return res.status(200).json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const createShopkeeper = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { name, email, password, mobile, shop_id } = req.body;

    if (!name || !email || !password || !mobile || !shop_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    try {
      await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(150)");
    } catch (_) { }

    const emailResult = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1", [email],
    );
    if (emailResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Email already exists" });
    }

    const mobileResult = await client.query(
      "SELECT id FROM users WHERE mobile = $1 LIMIT 1", [mobile],
    );
    if (mobileResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Mobile already exists" });
    }

    const shopResult = await client.query(
      "SELECT id, shopkeeper_id FROM shops WHERE id = $1 LIMIT 1", [shop_id],
    );
    if (shopResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid shop_id" });
    }
    if (shopResult.rows[0].shopkeeper_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Shop already assigned" });
    }

    const nameColumnResult = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'name' LIMIT 1`,
    );
    const hasNameColumn = nameColumnResult.rows.length > 0;

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = hasNameColumn
      ? await client.query(
        `INSERT INTO users (role, name, email, mobile, password_hash)
           VALUES ('shopkeeper', $1, $2, $3, $4) RETURNING id`,
        [name, email, mobile, passwordHash],
      )
      : await client.query(
        `INSERT INTO users (role, email, mobile, password_hash)
           VALUES ('shopkeeper', $1, $2, $3) RETURNING id`,
        [email, mobile, passwordHash],
      );

    const newUserId = userResult.rows[0].id;

    const assignResult = await client.query(
      `UPDATE shops SET shopkeeper_id = $1 WHERE id = $2 AND shopkeeper_id IS NULL`,
      [newUserId, shop_id],
    );

    if (assignResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Shop already assigned" });
    }

    await client.query("COMMIT");
    logger.info('Shopkeeper created', { email, shop_id });
    return res.status(201).json({ message: "Shopkeeper created", user_id: newUserId });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) { }

    if (error.code === "23505") {
      if (error.constraint === "users_mobile_key") return res.status(400).json({ error: "Mobile already exists" });
      if (error.constraint === "users_email_key") return res.status(400).json({ error: "Email already exists" });
    }

    return res.status(500).json({ error: error.message || "Failed to create shopkeeper" });
  } finally {
    client.release();
  }
};

module.exports = {
  createRationCard,
  getRationCards,
  getDbHealth,
  getBeneficiaries,
  getUsers,
  getAreas,
  getShops,
  createShopkeeper,
};
