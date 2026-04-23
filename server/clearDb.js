const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

const clearDB = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'civora',
        });
        
        console.log("Emptying database reports...");
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE history');
        await pool.query('TRUNCATE TABLE reports');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Successfully wiped existing reports!");
        process.exit(0);
    } catch(err) {
        console.error("Wipe failed", err);
        process.exit(1);
    }
};

clearDB();
