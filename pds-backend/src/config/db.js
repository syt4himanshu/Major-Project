const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

module.exports = pool;
