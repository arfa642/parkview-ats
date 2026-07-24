import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to the login page if the user is not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
