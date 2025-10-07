import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  
  // For development/testing purposes, allow access if not logged in
  // In production, you'd want to enforce authentication
  if (!isLoggedIn) {
    // Redirect to login instead of splash to avoid loops
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default AuthGuard; 