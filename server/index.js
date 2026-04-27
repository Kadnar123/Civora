const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use(cors());
// Increase payload limit because we will receive base64 photo strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'civora',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize ALL database tables on startup
const initDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      // Test connection first
      const conn = await pool.getConnection();
      console.log('✅ MySQL connection established successfully');
      conn.release();

      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          phone VARCHAR(20) UNIQUE,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          role ENUM('Citizen', 'Master Admin', 'Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Citizen',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Table "users" ready');

      // Create reports table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT DEFAULT NULL,
          report_id VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          status ENUM('Pending','In Progress','Resolved','Rejected') DEFAULT 'Pending',
          approval_level ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch',
          eta_date DATETIME NULL,
          priority ENUM('Low','Medium','High') DEFAULT 'Medium',
          lat DECIMAL(10,8) NOT NULL,
          lng DECIMAL(11,8) NOT NULL,
          address VARCHAR(500) DEFAULT NULL,
          department VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Table "reports" ready');

      // Create history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          report_id INT NOT NULL,
          status_text VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Table "history" ready');

      // Safely try to add/modify columns for backwards compatibility
      const safeAlter = async (sql, label) => {
        try { await pool.query(sql); } catch (e) { /* column already exists or not needed */ }
      };
      await safeAlter("ALTER TABLE reports ADD COLUMN user_id INT NULL", "user_id column");
      await safeAlter("ALTER TABLE reports MODIFY COLUMN approval_level ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch'", "approval_level enum");
      await safeAlter("ALTER TABLE reports MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending'", "status enum");

      // Verify all tables exist
      const [tables] = await pool.query("SHOW TABLES");
      console.log('✅ All tables in database:', tables.map(t => Object.values(t)[0]).join(', '));

      console.log('✅ Database initialization complete');
      return; // Success – exit retry loop

    } catch (err) {
      retries--;
      console.error(`❌ DB Init Error (${retries} retries left):`, err.message);
      if (retries === 0) {
        console.error('❌ FATAL: Could not connect to MySQL. Make sure MySQL is running and credentials in .env are correct.');
        console.error('   DB_HOST:', process.env.DB_HOST);
        console.error('   DB_USER:', process.env.DB_USER);
        console.error('   DB_NAME:', process.env.DB_NAME);
        process.exit(1);
      }
      // Wait 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

// Global JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'civora-super-secret-key-2026';

// Auto-Router Engine: Maps categories to appropriate departments and priorities
const assignDepartment = (category) => {
  const routingTable = {
    'Road': { dept: 'Public Works', priority: 'Medium' },
    'Sanitation': { dept: 'Waste Management', priority: 'Medium' },
    'Electrical': { dept: 'Energy & Utilities', priority: 'High' },
    'Water': { dept: 'Water Supply Board', priority: 'High' },
    'Other': { dept: 'General Municipal Services', priority: 'Low' }
  };
  return routingTable[category] || { dept: 'General Administration', priority: 'Low' };
};

// ==========================================
// Health Check Endpoint
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    const [tables] = await pool.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    res.json({ 
      status: 'ok', 
      database: 'connected',
      tables: tableNames,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ==========================================
// Authentication Endpoints
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const userRole = role || 'Citizen';
    
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'User with email/phone already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, hash, userRole]
    );

    const token = jwt.sign({ id: result.insertId, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: result.insertId, name, email, phone, role: userRole } });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const [users] = await pool.query("SELECT * FROM users WHERE email = ? OR phone = ?", [identifier, identifier]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ==========================================
// API Endpoints
// ==========================================

// Mock AI Image Analysis Endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { photoBase64 } = req.body;
    if (!photoBase64) return res.status(400).json({ error: 'No image provided' });

    // Simulate AI processing delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const categories = [
      { category: 'Road', title: 'Severe Pothole/Road Damage' },
      { category: 'Road', title: 'Broken Pavement' },
      { category: 'Water', title: 'Leaking Pipe / Water Logging' },
      { category: 'Water', title: 'Open Manhole' },
      { category: 'Electrical', title: 'Dangerous Hanging Wires' },
      { category: 'Electrical', title: 'Broken Street Light' },
      { category: 'Sanitation', title: 'Illegal Garbage Dumping' }
    ];

    const randomIssue = categories[Math.floor(Math.random() * categories.length)];

    res.json({
      success: true,
      category: randomIssue.category,
      title: randomIssue.title,
      confidence: (0.85 + (Math.random() * 0.14)).toFixed(2)
    });
  } catch (err) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({ success: false, error: 'AI analysis failed' });
  }
});

// 1. Submit a new report (Citizen Action)
app.post('/api/reports', async (req, res) => {
  try {
    const { title, category, description, lat, lng, address, user_id } = req.body;
    
    const autoRoute = assignDepartment(category);
    const report_id = 'REP-' + Math.floor(1000 + Math.random() * 9000);

    const [result] = await pool.query(
      "INSERT INTO reports (report_id, title, category, description, lat, lng, address, department, priority, approval_level, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Local Sarpanch', ?)",
      [report_id, title, category, description, lat, lng, address, autoRoute.dept, autoRoute.priority, user_id || null]
    );
    
    const insertId = result.insertId;
    
    // Log history
    await pool.query("INSERT INTO history (report_id, status_text) VALUES (?, ?)", [insertId, `Report Submitted and automatically assigned to Local Sarpanch (Level 1) for review`]);

    // Socket publish
    io.emit('report_created', { id: insertId, report_id, title, lat, lng, status: 'Pending', priority: autoRoute.priority });

    res.status(201).json({ success: true, message: 'Report Submitted', report_id });
  } catch (err) {
    console.error("Database Insert Error:", err);
    res.status(500).json({ success: false, error: 'Database submission failed' });
  }
});

// 2. Fetch all reports (Admin & Map Action)
app.get('/api/reports', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, 
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('created_at', h.created_at, 'text', h.status_text)) 
         FROM history h WHERE h.report_id = r.id ORDER BY h.created_at ASC) as history
      FROM reports r ORDER BY r.created_at DESC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, error: 'Database fetch failed' });
  }
});

// 2b. Fetch reports for specific user
app.get('/api/reports/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query(`
      SELECT r.*, 
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('created_at', h.created_at, 'text', h.status_text)) 
         FROM history h WHERE h.report_id = r.id ORDER BY h.created_at ASC) as history
      FROM reports r WHERE r.user_id = ? ORDER BY r.created_at DESC
    `, [userId]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("User Reports Fetch Error:", err);
    res.status(500).json({ success: false, error: 'Failed to fetch user reports' });
  }
});

// 3. Admin updates status, assignment, or adds a note
app.put('/api/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, category, department, priority, approval_level, eta_date } = req.body;
    
    let updates = [];
    let queryParams = [];
    
    if (status) { updates.push("status = ?"); queryParams.push(status); }
    if (category) { updates.push("category = ?"); queryParams.push(category); }
    if (department) { updates.push("department = ?"); queryParams.push(department); }
    if (priority) { updates.push("priority = ?"); queryParams.push(priority); }
    if (approval_level) { updates.push("approval_level = ?"); queryParams.push(approval_level); }
    if (eta_date) { updates.push("eta_date = ?"); queryParams.push(eta_date); }
    
    if (updates.length > 0) {
       queryParams.push(id);
       await pool.query(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`, queryParams);
    }

    if (note) {
      await pool.query("INSERT INTO history (report_id, status_text) VALUES (?, ?)", [id, note]);
    } else if (status || department || priority || approval_level || eta_date) {
      let actionText = [];
      if (status) actionText.push(`Status changed to ${status}`);
      if (department) actionText.push(`Re-assigned to ${department}`);
      if (priority) actionText.push(`Priority changed to ${priority}`);
      if (approval_level) actionText.push(`Approved & Escalated to ${approval_level}`);
      if (eta_date) actionText.push(`Target Resolution Date marked for ${new Date(eta_date).toLocaleDateString()}`);
      
      await pool.query("INSERT INTO history (report_id, status_text) VALUES (?, ?)", [id, actionText.join(' | ')]);
    }

    // Socket publish
    io.emit('report_updated', { id, status, department, priority, approval_level });

    res.status(200).json({ success: true, message: 'Updated successfully' });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, error: 'Failed to update report' });
  }
});

// 4. Bulk update action (Assign, Resolve)
app.put('/api/reports/bulk', async (req, res) => {
  try {
    const { reportIds, status, approval_level, note } = req.body;
    if (!reportIds || reportIds.length === 0) return res.status(400).json({ error: 'No reports selected' });

    let updates = [];
    let queryParams = [];
    
    if (status) { updates.push("status = ?"); queryParams.push(status); }
    if (approval_level) { updates.push("approval_level = ?"); queryParams.push(approval_level); }

    if (updates.length > 0) {
      const placeholders = reportIds.map(() => '?').join(',');
      const fullParams = [...queryParams, ...reportIds];
      
      await pool.query(`UPDATE reports SET ${updates.join(', ')} WHERE id IN (${placeholders})`, fullParams);
      
      for (const id of reportIds) {
         let actionText = [];
         if (status) actionText.push(`Bulk Status changed to ${status}`);
         if (approval_level) actionText.push(`Bulk Re-assigned to ${approval_level}`);
         await pool.query("INSERT INTO history (report_id, status_text) VALUES (?, ?)", [id, actionText.join(' | ') + (note ? ` - Note: ${note}` : '')]);
         io.emit('report_updated', { id, status, approval_level });
      }
    }
    
    res.status(200).json({ success: true, message: 'Bulk update successful' });
  } catch (err) {
    console.error("Bulk Update Error:", err);
    res.status(500).json({ success: false, error: 'Bulk update failed' });
  }
});

// 5. Delete a report
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM reports WHERE id = ?", [id]);
    io.emit('report_deleted', { id });
    res.status(200).json({ success: true, message: 'Report deleted' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

// ==========================================
// Start Server (after DB init)
// ==========================================
const PORT = process.env.PORT || 5000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Civora API Gateway running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for real-time updates`);
    console.log(`💾 MySQL Database: ${process.env.DB_NAME || 'civora'}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/health          - Health check`);
    console.log(`  POST /api/auth/register   - Register user`);
    console.log(`  POST /api/auth/login      - Login user`);
    console.log(`  POST /api/reports          - Submit report`);
    console.log(`  GET  /api/reports          - Get all reports`);
    console.log(`  GET  /api/reports/user/:id - Get user reports`);
    console.log(`  PUT  /api/reports/:id/status - Update report`);
    console.log(`  PUT  /api/reports/bulk     - Bulk update`);
    console.log(`  DELETE /api/reports/:id    - Delete report`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
