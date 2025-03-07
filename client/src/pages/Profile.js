import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing user data", error);
  }

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [tel, setTel] = useState("");
  const [isEditing, setIsEditing] = useState(false);  // ใช้เพื่อเช็คว่ากำลังแก้ไขหรือไม่

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // ดึงข้อมูลผู้ใช้จากเซิร์ฟเวอร์
    fetch(`http://localhost:5001/api/user/${user.username}`)
      .then((res) => res.json())
      .then((data) => {
        // อัปเดต state แต่ละตัวด้วยข้อมูลจากเซิร์ฟเวอร์
        setName(data.name);
        setLastName(data.lastname);
        setAge(data.age);
        setAddress(data.address);
        setTel(data.tel);
      })
      .catch((error) => console.error("Error fetching user data", error));
  }, [user, navigate]);

  // ฟังก์ชันเมื่อส่งข้อมูล
  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { name, lastname: lastName, age, address, tel };
    fetch(`http://localhost:5001/api/user/${user.username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),  // ส่งข้อมูลที่แก้ไขไป
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setIsEditing(false); // เมื่ออัปเดตเสร็จให้กลับมาแสดงเป็นข้อความ
      })
      .catch((error) => console.error("Error updating profile", error));
  };

  return (
    <div>
      <center>
        <h1>Profile</h1>
        {isEditing ? (
          // เมื่อกำลังแก้ไขจะแสดงฟอร์ม
          <form onSubmit={handleSubmit}>
            <label>
              Name: 
              <input 
                type="text" 
                name="name" 
                value={name}  // เชื่อมโยงกับ formData
                onChange={(e) => setName(e.target)}
                required 
              />
            </label>
            <br />
            <label>
              Lastname: 
              <input 
                type="text" 
                name="lastname" 
                value={lastName} 
                onChange={(e) => setLastName(e.target)}
                required 
              />
            </label>
            <br />
            <label>
              Age: 
              <input 
                type="number" 
                name="age" 
                value={age} 
                onChange={(e) => setAge(e.target)}
                required 
              />
            </label>
            <br />
            <label>
              Address: 
              <input 
                type="text" 
                name="address" 
                value={address} 
                onChange={(e) => setAddress(e.target)}
                required 
              />
            </label>
            <br />
            <label>
              Tel: 
              <input 
                type="text" 
                name="tel" 
                value={tel} 
                onChange={(e) => setTel(e.target)}
                required 
              />
            </label>
            <br />
            <button type="submit">Update Profile</button>
          </form>
        ) : (
          // เมื่อไม่กำลังแก้ไขจะแสดงเป็นข้อความ
          <div>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Lastname:</strong> {lastName}</p>
            <p><strong>Age:</strong> {age}</p>
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Tel:</strong> {tel}</p>
            <button onClick={() => setIsEditing(true)}>Edit</button>
          </div>
        )}
        <button onClick={() => navigate(`/${user.role}`)}>Back to Dashboard</button>
      </center>
    </div>
  );
};

export default Profile;
