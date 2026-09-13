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

  // 6. Set Admin Password (for Google users promoted to Admin)
  const setAdminPassword = async (newPassword) => {
    const res = await API.post('/auth/set-admin-password', { password: newPassword });
    if (res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  // 7. Logout
  const logout = () => {
    localStorage.removeItem('classic_cut_token');
    setToken(null);
    setUser(null);
  };

  // Connect to Live Real-Time Event Stream (SSE) for instant, zero-reload updates
  useEffect(() => {
    if (!token) return;

    const streamUrl = `${API.defaults.baseURL}/loyalty/live-stream?token=${encodeURIComponent(token)}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'STAMP_AWARDED') {
            if (user && data.userId === user._id) {
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      currentStamps: data.currentStamps,
                      lifetimeVisits: data.lifetimeVisits,
                      lastStampDate: data.lastStampDate,
                    }
                  : prev
              );
            }
          } else if (data.type === 'CUSTOMER_UPDATED') {
            if (user && data.userId === user._id) {
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      name: data.name || prev.name,
                      phone: data.phone || prev.phone,
                    }
                  : prev
              );
            }
          }
          // Dispatch global window event for components (StampCard, AdminDashboard)
          window.dispatchEvent(new CustomEvent('classic_cut_realtime', { detail: data }));
        } catch (err) {
          // heartbeat or non-json message
        }
      };

      eventSource.onerror = () => {
        // SSE auto-reconnects automatically
      };
    } catch (err) {
      console.warn('Realtime SSE init failed:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, user?._id]);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.email === 'ok8023361@gmail.com';
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'ok8023361@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        requestOtp,
        registerWithOtp,
        login,
        googleLogin,
        updateProfile,
        setAdminPassword,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
