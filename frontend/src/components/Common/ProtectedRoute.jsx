import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}

export function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const roles = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('roles') || '[]')
    : [];

  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/not-found" replace state={{ from: location }} />;
  }

  return children;
}

