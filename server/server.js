import express, { json } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2';

const app = express();
const PORT = process.env.PORT  || 5001;



app.use(express.json());
// สร้าง Connection ไปยังฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login_Data',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

app.use(cors({
  origin: 'http://localhost:3000', // URL ของ React app
  credentials: true  // เปิดใช้งานการส่งคุกกี้จากฝั่ง client
}));

app.use(json());

// ✅ API Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const now = Date.now();

  db.query('SELECT * FROM attempts WHERE username = ?', [username], (err, attemptRows) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    const userAttempts = attemptRows[0] || { count: 0, lastAttempt: 0 };

    if (userAttempts.count >= 10 && now - userAttempts.lastAttempt < 60000) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Try again in 1 minute.', cooldown: 60 });
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (rows.length === 0) {
        db.query('REPLACE INTO attempts (username, count, lastAttempt) VALUES (?, ?, ?)', [username, userAttempts.count + 1, now]);
        return res.status(401).json({ success: false, message: 'Invalid username or password' , attempts: userAttempts.count});
      }

      const user = rows[0];
      const isMatch = bcrypt.compareSync(password, user.password);

      if (!isMatch) {
        db.query('REPLACE INTO attempts (username, count, lastAttempt) VALUES (?, ?, ?)', [username, userAttempts.count + 1, now]);
        return res.status(401).json({ success: false, message: 'Invalid username or password' , attempts: userAttempts.count });
      }

      db.query('DELETE FROM attempts WHERE username = ?', [username]);
      res.json({ success: true, user: { username: user.username, role: user.role } });
    });
  });
});

// ✅ API Register
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (rows.length > 0) return res.status(400).json({ success: false, message: 'Username already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, message: 'User registered successfully' });
    });
  });
});
app.get("/api/user/:username", (req, res) => {
  const { username } = req.params;
  db.query("SELECT name, lastname, age, address, tel FROM users WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(results[0]);
  });
});

// ✅ อัปเดตข้อมูลผู้ใช้
app.put("/api/user/:username", (req, res) => {
  const { username } = req.params;
  const { name, lastname, age, address, tel } = req.body;
  db.query(
    "UPDATE users SET name = ?, lastname = ?, age = ?, address = ?, tel = ? WHERE username = ?",
    [name, lastname, age, address, tel, username],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, message: "Profile updated successfully" });
    }
  );
});




// ✅ API ตรวจสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
  res.send('Hello from Express server');
});

// ✅ เปิดเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log("🚀 Server listening on port ${PORT}");
});