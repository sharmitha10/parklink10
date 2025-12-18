import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      let errorMessage = 'Login failed';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
      } else if (error.response) {
        // Server responded with error
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid email or password';
        } else if (error.response.data?.errors) {
          // Validation errors
          errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if backend is running.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error scenarios
      let errorMessage = 'Registration failed';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = '❌ Cannot connect to server. Please ensure:\n1. Backend is running (npm run dev)\n2. MongoDB is running or connected';
      } else if (error.response) {
        // Server responded with error
        if (error.response.data?.errors) {
          // Validation errors from express-validator
          errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if backend is running.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
