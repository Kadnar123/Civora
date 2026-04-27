const mysql = require('mysql2/promise');
require('dotenv').config({path: './.env'});

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  
  try {
    await pool.query("ALTER TABLE reports DROP COLUMN photo_base64");
    console.log('Fixed DB: dropped photo_base64 column.');
  } catch(e) {
    console.error('Failed to drop column (maybe it is already dropped):', e.message);
  }

  process.exit();
}

run();
