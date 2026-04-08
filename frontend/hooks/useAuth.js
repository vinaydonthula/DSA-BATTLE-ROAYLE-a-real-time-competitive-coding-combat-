'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      // Check localStorage first
      const storedToken = localStorage.getItem("userToken");
      if (storedToken && !user) {
        // We have a token, so we're probably logged in. 
        // Let's set a temporary state to prevent the dashboard from kicking us out while the backend wakes up.
        setUser({ loading: true, isReturning: true }); 
      }

      try {
        const userData = await authAPI.me();
        setUser(userData);
      } catch (err) {
        console.error("Auth verification failed:", err);
        // Only clear if it was a definitive failure, not just a network error
        if (err.message && (err.message.includes("401") || err.message.includes("Unauthorized"))) {
           localStorage.removeItem("userToken");
           setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const user = await authAPI.login({ email, password });
      if (user.token) localStorage.setItem("userToken", user.token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const user = await authAPI.register({ username, email, password });
      if (user.token) localStorage.setItem("userToken", user.token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    localStorage.removeItem("userToken");
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
