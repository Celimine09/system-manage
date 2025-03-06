import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // 🔹 URL ของ Backend
});

// ✅ ดึง Token จาก LocalStorage และแนบไปกับทุก Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ ฟังก์ชัน Login
export const loginApi = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });

    // 🔹 ถ้าล็อคอินสำเร็จ ให้เก็บ Token และ User ใน LocalStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Network Error' };
  }
};

// ✅ ฟังก์ชัน Register
export const registerApi = async (username, password, role) => {
  try {
    const response = await api.post('/register', { username, password, role });
    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Network Error' };
  }
};

// ✅ ฟังก์ชัน Logout
export const logoutApi = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ✅ ฟังก์ชัน Get User (ใช้ดึงข้อมูลจาก LocalStorage)
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};