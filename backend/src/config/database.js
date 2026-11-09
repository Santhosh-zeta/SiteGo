const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection event listeners
pool.on('connect', () => {
  console.log('✅ PostgreSQL database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query function with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query', {
      text: text.substring(0, 50) + '...',
      duration: duration + 'ms',
      rows: res.rowCount
    });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// Get client for transactions
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Set a timeout for client checkout
  const timeout = setTimeout(() => {
    console.error('⚠️ Client checkout timeout - releasing client');
    client.release();
  }, 5000);

  // Override release to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    release();
  };

  return { query, release, client };
};

// Transaction helper
const transaction = async (callback) => {
  const { client, release } = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction
};
