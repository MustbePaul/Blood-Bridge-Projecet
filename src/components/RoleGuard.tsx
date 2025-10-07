import React from 'react';
import { Navigate } from 'react-router-dom';

type Role = 'admin' | 'hospital_staff' | 'blood_bank_staff';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  const userRole = (localStorage.getItem('user_role') || '') as Role | '';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'hospital_staff') return <Navigate to="/hospital-dashboard" replace />;
    if (userRole === 'blood_bank_staff') return <Navigate to="/bloodbank-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;


