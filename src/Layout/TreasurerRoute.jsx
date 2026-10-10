import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthProvider';

export default function TreasurerRoute({ children }) {
  const { userRole, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{padding: 50, textAlign: 'center'}}>Checking permissions...</div>;
  }

  if (userRole === 'treasurer') {
    return children;
  }

  return <Navigate to="/" replace />;
}