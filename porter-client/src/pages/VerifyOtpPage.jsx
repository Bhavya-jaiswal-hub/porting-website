// src/pages/VerifyOtpPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useAuth();

  const name = localStorage.getItem('signupName');
  const email = localStorage.getItem('signupEmail');
  const password = localStorage.getItem('signupPassword');

  useEffect(() => {
    if (!email || !name || !password) {
      navigate('/signup');
    }
  }, [email, name, password, navigate]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/verify-otp', {
        email,
        otp,
        name,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);

      if (typeof setIsAuthenticated === 'function') {
        setIsAuthenticated(true);
      } else {
        console.error('setIsAuthenticated is not a function');
      }

      if (typeof setUser === 'function') {
        setUser(user);
      } else {
        console.error('setUser is not a function');
      }

      localStorage.removeItem('signupEmail');
      localStorage.removeItem('signupName');
      localStorage.removeItem('signupPassword');

      navigate('/home');
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Verify OTP</h2>
        <form onSubmit={handleOtpSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
            required
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
