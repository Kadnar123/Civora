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
    await pool.query("ALTER TABLE reports MODIFY COLUMN approval_level ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch'");
    console.log('Fixed DB: approval_level column updated.');
  } catch(e) {
    console.error('Failed to alter approval_level:', e);
  }
  
  try {
     await pool.query("ALTER TABLE reports MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending'");
     console.log('Fixed DB: status column updated.');
  } catch(e) {
     // ignore status update error
  }

  process.exit();
}

run();
