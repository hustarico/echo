import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jwt'));
  const [username, setUsername] = useState(() => localStorage.getItem('username'));

  const login = useCallback((jwt, user) => {
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('username', user);
    setToken(jwt);
    setUsername(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
