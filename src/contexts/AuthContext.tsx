
import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCustomAuthToken, clearCustomAuthToken } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  cartorio_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Set the custom auth token for cartorio users
      if (userData.type === 'cartorio' && userData.token) {
        setCustomAuthToken(userData.token);
      }
    }
  }, []);

  const login = (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    const newUser: User = {
      id: userData?.id || '1',
      name: userData?.name || (type === 'cartorio' ? 'Cartório Exemplo' : 'Administrador'),
      type,
      token,
      cartorio_id: userData?.cartorio_id || (type === 'cartorio' ? '00000000-0000-0000-0000-000000000001' : undefined)
    };
    
    setUser(newUser);
    localStorage.setItem('siplan-user', JSON.stringify(newUser));
    
    // Set the custom auth token for API requests
    if (type === 'cartorio') {
      setCustomAuthToken(token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('siplan-user');
    clearCustomAuthToken();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
