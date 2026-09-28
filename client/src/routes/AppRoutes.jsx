import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AssetsPage } from '../pages/AssetsPage';
import { AssetDetailPage } from '../pages/AssetDetailPage';
import { AssetFormPage } from '../pages/AssetFormPage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { MaintenanceDetailPage } from '../pages/MaintenanceDetailPage';
import { QRScannerPage } from '../pages/QRScannerPage';
import { LocationsPage } from '../pages/LocationsPage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { VendorsPage } from '../pages/VendorsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { SettingsPage } from '../pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside Main Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Assets */}
        <Route path="assets" element={<AssetsPage />} />
        <Route
          path="assets/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AssetFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route
          path="assets/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
              <AssetFormPage />
            </ProtectedRoute>
          }
        />

        {/* Maintenance */}
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/:id" element={<MaintenanceDetailPage />} />

        {/* QR Scanner */}
        <Route path="qr-scanner" element={<QRScannerPage />} />

        {/* Infrastructure Management */}
        <Route path="locations" element={<LocationsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="vendors" element={<VendorsPage />} />

        {/* Reports & Analytics */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Compliance & Administration */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
