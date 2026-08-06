import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Employees from './pages/Employees';
import Assignments from './pages/Assignments';
import Transfers from './pages/Transfers';
import Returns from './pages/Returns';
import EmployeeAssets from './pages/EmployeeAssets';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import ImportData from './pages/ImportData';
import Settings from './pages/Settings';
import AccessManagement from './pages/AccessManagement';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AssetProvider } from './context/AssetContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AssetProvider>
          <HashRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="employees" element={<Employees />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="transfers" element={<Transfers />} />
                <Route path="returns" element={<Returns />} />
                <Route path="employee-assets" element={<EmployeeAssets />} />
                <Route path="reports" element={<Reports />} />
                <Route path="audit-log" element={<AuditLog />} />
                <Route path="import-data" element={<ImportData />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="access-management" element={<AccessManagement />} />
              </Route>
            </Route>
          </Routes>
          </HashRouter>
        </AssetProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
