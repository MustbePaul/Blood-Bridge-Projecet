import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '../rbac/rbac';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  const rawRole = (localStorage.getItem('user_role') || '') as string;
  // Database stores 'admin', 'blood_bank_staff', 'hospital_staff', 'donor'
  const userRole = (rawRole as Role) || '';
  
  // Debug logging
  console.log('RoleGuard check:', {
    isLoggedIn,
    userRole,
    allowedRoles,
    hasAccess: allowedRoles.includes(userRole)
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'blood_bank_admin' || userRole === 'blood_bank_staff') return <Navigate to="/bloodbank-dashboard" replace />;
    if (userRole === 'hospital_staff') return <Navigate to="/hospital-dashboard" replace />;
    if (userRole === 'donor') return <Navigate to="/donor/profile" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;

