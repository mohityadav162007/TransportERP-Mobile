import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import TripForm from './pages/TripForm';
import PODUpload from './pages/PODUpload';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Masters from './pages/Masters';
import Profile from './pages/Profile';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path="trips/:id/pod" element={<PODUpload />} />
            <Route path="trips/add" element={<TripForm />} />
            <Route path="trips/edit/:id" element={<TripForm />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="masters" element={<Masters />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
