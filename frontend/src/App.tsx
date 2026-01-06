import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import TeamRegistrationNew from './components/TeamRegistrationNew';
import ManagerPage from './components/ManagerPage';
import VisitorRegistration from './components/VisitorRegistration';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <CoordinatorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coordinator" 
            element={
              <ProtectedRoute>
                <CoordinatorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team-registration" 
            element={
              <ProtectedRoute>
                <TeamRegistrationNew />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/visitor-registration" 
            element={
              <ProtectedRoute>
                <VisitorRegistration />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
