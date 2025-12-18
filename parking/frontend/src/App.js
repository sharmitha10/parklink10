import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TranslationProvider } from './components/LanguageSwitcher';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FindParking from './pages/FindParking';
import MyBookings from './pages/MyBookings';
import ManageSlots from './pages/ManageSlots';
import AddParkingSlot from './pages/AddParkingSlot';
import Analytics from './pages/Analytics';

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';

console.log("ENV TEST:", process.env.REACT_APP_API_URL);

function AppContent() {
  const location = useLocation();
  // List of routes where Navbar should be hidden
  const hideNavbarPaths = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          } />
          <Route path="/find-parking" element={
            <PrivateRoute>
              <FindParking />
            </PrivateRoute>
          } />
          <Route path="/my-bookings" element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/manage-slots" element={
            <AdminRoute>
              <ManageSlots />
            </AdminRoute>
          } />
          <Route path="/admin/add-parking-slot" element={
            <AdminRoute>
              <AddParkingSlot />
            </AdminRoute>
          } />
          <Route path="/admin/edit-parking-slot/:id" element={
            <AdminRoute>
              <AddParkingSlot />
            </AdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminRoute>
              <Analytics/>
            </AdminRoute>
          }/>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </TranslationProvider>
    </AuthProvider>
  );
}

export default App;
