const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

async function test() {
  try {
    const pool = mysql.createPool({ 
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    await pool.query('SELECT 1');
    console.log('Database Connected Successfully!');
    process.exit(0);
  } catch(e) {
    console.error('Database Connection Error:', e.message);
    process.exit(1);
  }
}
test();
