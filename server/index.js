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

// Initialize database tables if missing
const initDB = async () => {
  try {
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
      )
    `);
    console.log("✓ Users table ready");

    // Create reports table with correct schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        report_id VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('Pending','In Progress','Resolved') DEFAULT 'Pending',
        approval_level ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch',
        eta_date DATETIME NULL,
        priority ENUM('Low','Medium','High') DEFAULT 'Medium',
        lat DECIMAL(10,8) NOT NULL,
        lng DECIMAL(11,8) NOT NULL,
        address VARCHAR(500) DEFAULT NULL,
        department VARCHAR(100) NOT NULL,
        photo_base64 LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ Reports table ready");

    // Create history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        status_text VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ History table ready");
    
    // Ensure user_id column exists in reports
    try {
      await pool.query("ALTER TABLE reports ADD COLUMN user_id INT NULL");
    } catch (e) {}
    
    // Ensure approval_level enum is up to date
    try {
      await pool.query("ALTER TABLE reports MODIFY COLUMN approval_level ENUM('Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector') DEFAULT 'Local Sarpanch'");
    } catch (e) {}
    
    // Create demo admin user if not exists
    try {
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", ['admin@civora.local']);
      if (existing.length === 0) {
        const demoHash = await bcrypt.hash('admin123', 10);
        await pool.query(
          "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
          ['Admin User', 'admin@civora.local', '9999999999', demoHash, 'Master Admin']
        );
        console.log("✓ Demo admin user created (email: admin@civora.local, password: admin123)");
      }
    } catch (e) {
      console.warn("Demo user creation skipped:", e.message);
    }
    
    console.log("✓ Database initialization complete");
  } catch (err) {
    console.error("✗ DB Init Error:", err.message);
  }
};
initDB();

// Global JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'civora-super-secret-key-2026';

// Auto-Router Engine: Maps categories to appropriate departments and priorities natively
// Auto-Router Engine: Maps categories to appropriate departments and priorities natively
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
    console.error(err);
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

    // For the mock, we will randomly assign an infrastructure issue.
    // In a production app, this would send `photoBase64` to Gemini or AWS Rekognition.
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
      confidence: (0.85 + (Math.random() * 0.14)).toFixed(2) // Mock confidence 85-99%
    });
  } catch (err) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({ success: false, error: 'AI analysis failed' });
  }
});

// 1. Submit a new report (Citizen Action)
app.post('/api/reports', async (req, res) => {
  try {
    const { title, category, description, lat, lng, address, photoBase64, user_id } = req.body;
    
    // Auto-detect department and priority based on severity templates
    const autoRoute = assignDepartment(category);
    
    // Generate a quick readable ID
    const report_id = 'REP-' + Math.floor(1000 + Math.random() * 9000);

    const checkQuery = "INSERT INTO reports (report_id, title, category, description, lat, lng, address, department, priority, photo_base64, approval_level, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Local Sarpanch', ?)";
    const [result] = await pool.query(checkQuery, [report_id, title, category, description, lat, lng, address, autoRoute.dept, autoRoute.priority, photoBase64, user_id || null]);
    
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
      SELECT r.* FROM reports r ORDER BY r.created_at DESC
    `);

    // Add history for each report
    for (let report of rows) {
      try {
        const [historyRows] = await pool.query(`
          SELECT created_at, status_text as text FROM history
          WHERE report_id = ? ORDER BY created_at ASC
        `, [report.id]);

        report.history = historyRows.map(h => ({
          created_at: h.created_at,
          text: h.text
        }));
      } catch (historyErr) {
        console.warn(`Failed to fetch history for report ${report.id}:`, historyErr.message);
        report.history = [];
      }
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, error: 'Database fetch failed' });
  }
});

// 3. Admin updates status, assignment, or adds a note
app.put('/api/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, category, department, priority, approval_level, eta_date } = req.body;
    
    // Update core fields if provided
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

    // Connect socket
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
      // Create dynamically sized parameter array for the IN clause
      const placeholders = reportIds.map(() => '?').join(',');
      const fullParams = [...queryParams, ...reportIds];
      
      await pool.query(`UPDATE reports SET ${updates.join(', ')} WHERE id IN (${placeholders})`, fullParams);
      
      // Update history for each
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Civora API Gateway with Sockets running on port ${PORT}`);
});
