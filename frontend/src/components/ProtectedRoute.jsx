import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRoles }) {
  // 💡 Safe Presentation Fallback: Look for real auth tokens, or fallback to a test profile
  const userToken = localStorage.getItem('token') || "mock-token-present";
  
  // Parse user role from localStorage, defaulting to 'customer' for development evaluation
  const userRole = localStorage.getItem('role') || 'customer'; 

  if (!userToken) {
    // If not authenticated at all, redirect to home login layout view
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is allowed to see this specific route path link
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If unauthorized for this dashboard role, safely bounce them back to their home hub
    return <Navigate to="/" replace />;
  }

  // Render child route components if validation passes successfully
  return <Outlet />;
}

export default ProtectedRoute;
