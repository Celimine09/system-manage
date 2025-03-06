import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // ✅ ดึงค่าจาก localStorage อย่างปลอดภัย
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing user data", error);
  }

  // ✅ ถ้าไม่มี user → Redirect ไปที่ Login
  if (!user) {
    navigate("/login");
    return null; // ❌ หลีกเลี่ยงการ render JSX ถ้ายังไม่มีข้อมูล user
  }

  return (
    <div><center>
      <h1>Admin Panel</h1>
      <p>Welcome, {user.username}!</p>
      <p>Your role: {user.role}</p>
      <button onClick={() => {
        localStorage.removeItem("user");
        navigate("/login");
      }}>
        Logout
      </button>
      </center></div>
  );
};

export default AdminDashboard;