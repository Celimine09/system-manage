import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const usersFile = path.join(__dirname, '../data/users.json');

// ✅ ฟังก์ชันอ่านข้อมูลจาก `users.json`
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersFile);
    return JSON.parse(data);
  } catch (error) {
    return []; // กรณีไฟล์ยังไม่มีข้อมูล
  }
};

// ✅ ฟังก์ชันเขียนข้อมูลลง `users.json`
const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// ✅ ระบบจำกัดจำนวนครั้ง Login ผิดพลาด
const loginAttempts = {}; // { username: { attempts: 0, cooldownUntil: timestamp } }

// ✅ API Register (ลงทะเบียน)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  let users = readUsers();

  // 1️⃣ เช็คว่าชื่อซ้ำหรือไม่
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  // 2️⃣ เช็คความยาวรหัสผ่าน
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  // 3️⃣ ✅ Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4️⃣ ✅ เพิ่ม user ใหม่
  const newUser = { username, password: hashedPassword, role };
  users.push(newUser);
  writeUsers(users);

  res.json({ success: true, message: 'User registered successfully', user: { username, role } });
});

// ✅ API Login (เข้าสู่ระบบ)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password', attempts: 0 });
  }

  // ✅ ตรวจสอบว่าผู้ใช้ติด Cooldown หรือไม่
  const currentTime = Date.now();
  if (loginAttempts[username] && loginAttempts[username].cooldownUntil > currentTime) {
    const waitTime = Math.ceil((loginAttempts[username].cooldownUntil - currentTime) / 1000);
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${waitTime} seconds.`,
      cooldown: waitTime,
      attempts: 10
    });
  }

  // ✅ ตรวจสอบรหัสผ่าน
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // ❌ บันทึกจำนวนครั้งที่ Login ผิด
    if (!loginAttempts[username]) {
      loginAttempts[username] = { attempts: 1, cooldownUntil: 0 };
    } else {
      loginAttempts[username].attempts += 1;
    }

    const remainingAttempts = 10 - loginAttempts[username].attempts;

    // ✅ ถ้า Login ผิด 10 ครั้ง → ติด Cooldown 1 นาที
    if (loginAttempts[username].attempts >= 10) {
      loginAttempts[username].cooldownUntil = currentTime + 60000;
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Try again in 60 seconds.',
        cooldown: 60,
        attempts: 10
      });
    }

    return res.status(401).json({
      success: false,
      message: `Invalid username or password. ${remainingAttempts}/10 attempts remaining.`,
      attempts: loginAttempts[username].attempts
    });
  }

  // ✅ ถ้า Login สำเร็จ → รีเซ็ตจำนวนครั้งที่ผิดพลาด
  loginAttempts[username] = { attempts: 0, cooldownUntil: 0 };

  // ✅ สร้าง Token จำลอง
  const fakeToken = `token-${user.username}-${Date.now()}`;

  res.json({
    success: true,
    user: { username: user.username, role: user.role },
    token: fakeToken
  });
});

export default router;