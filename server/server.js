import express, { json } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 5001;

const USERS_FILE = path.resolve('data/users.json');
const ATTEMPTS_FILE = path.resolve('data/attempts.json');

app.use(cors());
app.use(json());

// ✅ ฟังก์ชันโหลด Users จาก `users.json`
const loadUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error loading users:", error);
    return [];
  }
};

// ✅ ฟังก์ชันบันทึก Users ลง `users.json`
const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error("❌ Error saving users:", error);
  }
};

// ✅ โหลดข้อมูลความพยายามล็อกอินของผู้ใช้
const loadAttempts = () => {
  try {
    if (!fs.existsSync(ATTEMPTS_FILE)) {
      fs.writeFileSync(ATTEMPTS_FILE, '{}', 'utf8');
    }
    return JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf8'));
  } catch (error) {
    console.error("❌ Error loading attempts:", error);
    return {};
  }
};

// ✅ บันทึกข้อมูลความพยายามล็อกอิน
const saveAttempts = (attempts) => {
  try {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2), 'utf8');
  } catch (error) {
    console.error("❌ Error saving attempts:", error);
  }
};

// ✅ API Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  let attempts = loadAttempts();

  console.log("🔹 Users in Database:", users);
  console.log("🔹 Login Attempt:", { username, password });

  // ตรวจสอบว่าผู้ใช้ล็อกอินเกิน 10 ครั้งหรือไม่
  const userAttempts = attempts[username] || { count: 0, lastAttempt: 0 };
  const now = Date.now();

  if (userAttempts.count >= 10 && now - userAttempts.lastAttempt < 60000) {
    return res.status(429).json({ success: false, message: "Too many failed attempts. Try again in 1 minute.", cooldown: 60 });
  }

  const user = users.find((u) => u.username === username);
  console.log("🔹 Found User:", user);

  if (!user) {
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    attempts[username] = userAttempts;
    saveAttempts(attempts);
    return res.status(401).json({ success: false, message: 'Invalid username or password', attempts: userAttempts.count });
  }

    console.log("🔹 Plain Password:", password);
    console.log("🔹 Hashed Password from DB:", user.password);

  const isMatch = bcrypt.compareSync(password, user.password);
  console.log("🔹 Password Match:", isMatch);

  if (!isMatch) {
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    attempts[username] = userAttempts;
    saveAttempts(attempts);
    return res.status(401).json({ success: false, message: 'Invalid username or password', attempts: userAttempts.count });
  }

  // ✅ ล็อกอินสำเร็จ รีเซ็ตจำนวนครั้งที่กรอกผิด
  delete attempts[username];
  saveAttempts(attempts);

  res.json({ success: true, user: { username: user.username, role: user.role } });
});

// ✅ API Register (ลงทะเบียน)
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    let users = loadUsers();
  
    // ตรวจสอบว่า username ซ้ำหรือไม่
    if (users.some((user) => user.username === username)) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
  
    // เข้ารหัส Password
    const hashedPassword = bcrypt.hashSync(password, 20);
    console.log(`🔹 Hashed Password for ${username}:`, hashedPassword);  // ✅ Debugging
  
    // เพิ่ม User ใหม่
    const newUser = { username, password: hashedPassword, role };
    users.push(newUser);
    saveUsers(users);
  
    res.json({ success: true, message: 'User registered successfully', user: newUser });
  });


// ✅ API ตรวจสอบสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
  res.send('Hello from Express server');
});

// ✅ เปิดเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});