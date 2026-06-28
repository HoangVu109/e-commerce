import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi.js';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (token) {
        const jwt = parseJwt(token);
        parsed.userId = jwt?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
          || jwt?.sub
          || jwt?.nameid;
      }
      setUser(parsed);
    }
    setAuthLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      const { token, name, roleNames } = res.data;

      const jwt = parseJwt(token);
      const userId = jwt?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        || jwt?.sub
        || jwt?.nameid;

      const userData = { name, email, roleNames, userId };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { ok: true, roleNames };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      await authApi.register({ name, email, phoneNumber: phone, password });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      authLoading,
      user,
      login,
      logout,
      register,
      isAdmin: user?.roleNames?.includes('Admin') ?? false,
      isStaff: user?.roleNames?.includes('Staff') ?? false,
      isCustomer: user?.roleNames?.includes('Customer') ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
