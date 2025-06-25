
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient } from '@/integrations/supabase/client';

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
  authenticatedClient: any; // Supabase client with auth headers
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Create authenticated client for cartorio users
      if (userData.type === 'cartorio' && userData.token) {
        const authClient = createAuthenticatedClient(userData.token);
        setAuthenticatedClient(authClient);
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
    
    // Create authenticated client for API requests
    if (type === 'cartorio') {
      const authClient = createAuthenticatedClient(token);
      setAuthenticatedClient(authClient);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, authenticatedClient }}>
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
