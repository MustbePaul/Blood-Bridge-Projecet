// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './components/routes';
import ProtectedLayout from './components/ProtectedLayout';
import RoleGuard from './components/RoleGuard';

// Pages (lazy-loaded for code splitting)
const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DonorRegistration = lazy(() => import('./pages/DonorRegistration'));
const DonorList = lazy(() => import('./pages/DonorList'));
const DonorDetails = lazy(() => import('./pages/DonorDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BloodBankDashboard = lazy(() => import('./pages/BloodBankDashboard'));
const HospitalDashboard = lazy(() => import('./pages/HospitalDashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const InventoryList = lazy(() => import('./pages/InventoryList'));
const AddInventory = lazy(() => import('./pages/AddInventory'));
const NewRequest = lazy(() => import('./pages/NewRequest'));
const TransferStatus = lazy(() => import('./pages/TransferStatus'));
const TransferRequest = lazy(() => import('./pages/TransferRequest'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Hospitals = lazy(() => import('./pages/Hospitals'));
const BloodBanks = lazy(() => import('./pages/Blood_banks'));
const BloodTypes = lazy(() => import('./pages/Bloodtypes'));
const Donors = lazy(() => import('./pages/donors'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const ApproveRequests = lazy(() => import('./pages/ApproveRequests'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));

// Components

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to={ROUTES.splash} replace />} />
        <Route path={ROUTES.splash} element={<SplashScreen />} />
        <Route path={ROUTES.login} element={<Login />} />
        <Route path={ROUTES.register} element={<Register />} />
        <Route path={ROUTES.donors} element={<Donors />} />
        <Route path={ROUTES.donorRegistration} element={<DonorRegistration isPublic />} />
        <Route path={ROUTES.DonorDetails} element={<DonorDetails />} />

        {/* Dashboards */}
        <Route
          path={ROUTES.adminDashboard}
          element={
            <RoleGuard allowedRoles={['admin']}>
              <ProtectedLayout>
                <AdminDashboard />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.bloodBankDashboard}
          element={
            <RoleGuard allowedRoles={['blood_bank_staff']}>
              <ProtectedLayout>
                <BloodBankDashboard />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.hospitalDashboard}
          element={
            <RoleGuard allowedRoles={['hospital_staff']}>
              <ProtectedLayout>
                <HospitalDashboard />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Authenticated routes */}
        <Route
          path={ROUTES.notifications}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <Notifications />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.settings}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <Profile />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.accountSettings}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <AccountSettings />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Inventory */}
        <Route
          path={ROUTES.inventory}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <InventoryList />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.addInventory}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <AddInventory />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Donor Management */}
        <Route
          path={ROUTES.DonorList}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <DonorList />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

       {/* Requests / Transfers */}
        <Route
          path={ROUTES.transferStatus}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <TransferStatus />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.transferRequest}
          element={
            <RoleGuard allowedRoles={['admin', 'blood_bank_staff']}>
              <ProtectedLayout>
                <TransferRequest />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
        path={ROUTES.orderTracking}
        element={
          <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
            <ProtectedLayout>
              <OrderTracking />
            </ProtectedLayout>
          </RoleGuard>
        }
        />
        <Route
        path={ROUTES.newRequest}
        element={
          <RoleGuard allowedRoles={['hospital_staff']}>
            <ProtectedLayout>
              <NewRequest />
            </ProtectedLayout>
          </RoleGuard>
        }
        />
        <Route
        path={ROUTES.approveRequests}
        element={
          <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
            <ProtectedLayout>
              <ApproveRequests />
            </ProtectedLayout>
          </RoleGuard>
        }
        />
        <Route
        path={ROUTES.requestDetails}
        element={
          <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
            <ProtectedLayout>
              <RequestDetail />
            </ProtectedLayout>
          </RoleGuard>
        }
        />
        
        
        {/* Quick action / facilities */}
        <Route
          path="/hospitals"
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <Hospitals />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.Blood_banks}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <BloodBanks />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.Bloodtypes}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <BloodTypes />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Analytics & System */}
        <Route
          path={ROUTES.analytics}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <AnalyticsDashboard />
              </ProtectedLayout>
            </RoleGuard>
          }
        />
        <Route
          path={ROUTES.systemHealth}
          element={
            <RoleGuard allowedRoles={['admin', 'hospital_staff', 'blood_bank_staff']}>
              <ProtectedLayout>
                <SystemHealth />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Admin-only */}
        <Route
          path={ROUTES.UserManagement}
          element={
            <RoleGuard allowedRoles={['admin']}>
              <ProtectedLayout>
                <UserManagement />
              </ProtectedLayout>
            </RoleGuard>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.splash} replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
