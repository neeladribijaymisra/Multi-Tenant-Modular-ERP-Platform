import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('erp_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loginError, setLoginError] = useState('');

  const login = async (username, password, expectedRole = null, portal = 'masterAdmin') => {
    try {
      const { data } = await api.post('/auth/login', { username, password, portal });
      const { accessToken, refreshToken, admin } = data.data;

      if (expectedRole && admin.role !== expectedRole) {
        setLoginError('This account does not have access to the selected portal.');
        return false;
      }

      localStorage.setItem('erp_access_token', accessToken);
      localStorage.setItem('erp_refresh_token', refreshToken);
      const userWithPortal = { ...admin, portal };
      localStorage.setItem('erp_admin_user', JSON.stringify(userWithPortal));
      setUser(userWithPortal);
      setLoginError('');
      return true;
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid username or password.');
      return false;
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_admin_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('erp_admin_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginError, setLoginError, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
