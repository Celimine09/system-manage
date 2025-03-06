import React, { createContext, useState, useEffect } from 'react';
import { loginApi } from '../service/api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    const response = await loginApi(username, password);
    if (response.success) {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));

      // ✅ Redirect ไปยัง Dashboard ตาม role
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else if (response.user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/user');
      }
    } else {
      alert(response.message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};