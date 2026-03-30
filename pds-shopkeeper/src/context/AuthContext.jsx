import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const parseToken = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      mobile: payload.mobile,
    };
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('sk_token') || '');
  const [user, setUser] = useState(() => parseToken(localStorage.getItem('sk_token')));

  const login = (nextToken) => {
    localStorage.setItem('sk_token', nextToken);
    setToken(nextToken);
    setUser(parseToken(nextToken));
  };

  const logout = () => {
    localStorage.removeItem('sk_token');
    setToken('');
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('shopkeeper:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('shopkeeper:unauthorized', handleUnauthorized);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user],
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
