
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { motion } from 'framer-motion';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (isLogin) {
        const response = await api.post('/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem('token', response.data.token);
        setSuccess('Login successful');
        navigate('/');
      } else {
        const response = await api.post('/api/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        setSuccess('Registration successful');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 flex items-center justify-center"
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        )}
        <button
          onClick={handleSubmit}
          className="w-full bg-primary-600 text-white p-2 rounded hover:bg-primary-700"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-primary-600 hover:underline"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    </motion.div>
  );
}

export default Login;
