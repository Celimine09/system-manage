import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../service/api';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    const response = await loginApi(username, password);

    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate(`/${response.user.role}`); // ✅ Redirect ไปหน้า Dashboard ตาม Role
    } else {
      setMessage(response.message);
      setAttempts(response.attempts || 0);
      if (response.cooldown) {
        setCooldown(response.cooldown);
      }
    }
  };

  return (
    <div><center>
      <h1>Login</h1>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      {attempts > 0 && attempts < 10 && <p>You have {10 - attempts} attempts left.</p>}
      {cooldown > 0 && <p style={{ color: 'orange' }}>Too many attempts! Please wait {cooldown} seconds.</p>}
      <form onSubmit={handleLogin}>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <br />
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <br />
        <button type="submit" disabled={cooldown > 0}>Login</button>
      </form>
      <br />
      <button onClick={() => navigate('/register')}>Go to Register</button>
      </center></div>
  );
};

export default Login;