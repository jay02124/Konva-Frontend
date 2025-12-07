
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/login';
import TemplateEditor from './pages/TemplateEditor';
import Templates from './pages/Templates';
import Students from './pages/Students';
import GenerateIDCards from './pages/GenerateIDCards';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (

      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Templates />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Templates />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Students />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate"
            element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <GenerateIDCards />
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>

  );
}

export default App;
