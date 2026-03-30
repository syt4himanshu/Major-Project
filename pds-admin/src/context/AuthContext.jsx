import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const parseToken = (token) => {
  try {
    const decoded = jwtDecode(token);

    if (!decoded?.exp || decoded.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email || '',
    };
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('pds_token');
    if (!savedToken) {
      localStorage.removeItem('pds_token');
      setToken(null);
      setUser(null);
      return;
    }

    const parsedUser = parseToken(savedToken);
    if (!parsedUser) {
      localStorage.removeItem('pds_token');
      setToken(null);
      setUser(null);
      return;
    }

    setToken(savedToken);
    setUser(parsedUser);
  }, []);

  const login = (newToken) => {
    const parsedUser = parseToken(newToken);
    if (!parsedUser) {
      localStorage.removeItem('pds_token');
      setToken(null);
      setUser(null);
      return;
    }

    localStorage.setItem('pds_token', newToken);
    setToken(newToken);
    setUser(parsedUser);
  };

  const logout = () => {
    localStorage.removeItem('pds_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
