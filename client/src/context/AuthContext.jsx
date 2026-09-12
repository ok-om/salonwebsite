import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('classic_cut_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists
  const loadUser = async () => {
    const savedToken = localStorage.getItem('classic_cut_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await API.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      console.warn('Session expired or invalid token');
      localStorage.removeItem('classic_cut_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const handleFocus = () => {
      if (localStorage.getItem('classic_cut_token')) {
        loadUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 1. Request OTP
  const requestOtp = async (email) => {
    const res = await API.post('/auth/request-otp', { email });
    return res.data;
  };

  // 2. Register with OTP
  const registerWithOtp = async (userData) => {
    const res = await API.post('/auth/register', userData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('classic_cut_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  // 3. Login
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('classic_cut_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  // 4. Google OAuth
  const googleLogin = async (credential) => {
    const res = await API.post('/auth/google', { credential });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('classic_cut_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  // 5. Update Profile
  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    if (res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  // 6. Logout
  const logout = () => {
    localStorage.removeItem('classic_cut_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        requestOtp,
        registerWithOtp,
        login,
        googleLogin,
        updateProfile,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
