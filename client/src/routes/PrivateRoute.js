// client/src/Routes/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  // ถ้ายังไม่ได้ login -> ไป /login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ถ้ามี allowedRoles แต่ role ไม่ตรง -> Access Denied
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <h1>Access Denied</h1>;
  }

  return children;
};

export default PrivateRoute;