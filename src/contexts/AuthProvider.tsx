
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthContext, debugAuthContext, getAuthContextId, User, CartorioLoginData, AuthContextType } from '@/contexts/AuthContextSingleton';
import { useStableAuth } from '@/hooks/useStableAuth';
import { createAuthenticatedClient } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔐 [AuthProvider] Rendering with context ID:', getAuthContextId());
  debugAuthContext('AuthProvider');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const stableAuth = useStableAuth();

  // Restore user from localStorage only once
  useEffect(() => {
    console.log('🔐 [AuthProvider] Initialization effect running');
    
    if (isInitialized) {
      console.log('🔐 [AuthProvider] Already initialized, skipping');
      return;
    }
    
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔐 [AuthProvider] Restoring user from localStorage:', {
          type: userData.type,
          cartorio_id: userData.cartorio_id,
          username: userData.username
        });
        
        if (userData.type === 'cartorio' && userData.jwtToken) {
          setCurrentUser(userData);
          const authClient = createAuthenticatedClient(userData.jwtToken);
          setAuthenticatedClient(authClient);
          console.log('🔐 [AuthProvider] User restored successfully');
        }
      } catch (err) {
        console.error('❌ [AuthProvider] Error restoring saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
    
    setIsInitialized(true);
    console.log('🔐 [AuthProvider] Initialization completed');
  }, []); // Empty dependency array - run only once

  // Handle admin user from stableAuth
  useEffect(() => {
    if (!isInitialized) return;
    
    if (stableAuth.session?.user && stableAuth.isAdmin && currentUser?.type !== 'admin') {
      console.log('🔐 [AuthProvider] Setting admin user');
      
      const adminUser: User = {
        id: stableAuth.session.user.id,
        name: 'Administrador',
        type: 'admin',
        email: stableAuth.session.user.email || ''
      };
      
      setCurrentUser(adminUser);
      
      // Clear cartorio data if exists
      if (currentUser?.type === 'cartorio') {
        localStorage.removeItem('siplan-user');
        setAuthenticatedClient(null);
      }
    } else if (!stableAuth.session && currentUser?.type === 'admin') {
      console.log('🔐 [AuthProvider] Clearing admin user - no session');
      setCurrentUser(null);
      setAuthenticatedClient(null);
    }
  }, [stableAuth.session?.user?.id, stableAuth.isAdmin, currentUser?.type, isInitialized]);

  const loginCartorio = useCallback(async (token: string, userData: CartorioLoginData): Promise<User> => {
    console.log('🔐 [AuthProvider] Starting cartorio login');

    try {
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ 
          username: userData.username, 
          login_token: token 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to authenticate: ${response.status}`);
      }

      const authData = await response.json();
      
      if (!authData.success || !authData.token) {
        throw new Error('Invalid response from login service');
      }

      const newUser: User = {
        id: authData.usuario?.id || userData.username,
        name: authData.usuario?.username || userData.username,
        type: 'cartorio',
        token: token,
        jwtToken: authData.token,
        cartorio_id: authData.cartorio?.id,
        cartorio_name: authData.cartorio?.nome,
        username: authData.usuario?.username || userData.username,
        email: authData.usuario?.email
      };

      // Create authenticated client
      const authClient = createAuthenticatedClient(authData.token);
      
      // Update states
      setCurrentUser(newUser);
      setAuthenticatedClient(authClient);
      
      // Save to localStorage
      localStorage.setItem('siplan-user', JSON.stringify(newUser));

      console.log('✅ [AuthProvider] Cartorio login successful');
      return newUser;
    } catch (error) {
      console.error('❌ [AuthProvider] Cartorio login failed:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    console.log('🔐 [AuthProvider] Login called:', { type });
    
    if (type === 'cartorio') {
      if (!userData?.username) {
        throw new Error('Username é obrigatório para login de cartório');
      }
      
      await loginCartorio(token, {
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        email: userData.email
      });
    } else {
      const newUser: User = {
        id: userData?.id || '1',
        name: userData?.name || 'Administrador',
        type,
        email: userData?.email
      };
      setCurrentUser(newUser);
    }
    
    console.log('✅ [AuthProvider] Login completed');
  }, [loginCartorio]);

  const logout = useCallback(async () => {
    console.log('🔐 [AuthProvider] Logout called');
    
    if (currentUser?.type === 'admin') {
      await stableAuth.logout();
    }
    
    setCurrentUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    
    console.log('✅ [AuthProvider] Logout completed');
  }, [currentUser?.type, stableAuth]);

  // Final user determination
  const finalUser = currentUser || (stableAuth.session?.user && stableAuth.isAdmin ? {
    id: stableAuth.session.user.id,
    name: 'Administrador',
    type: 'admin' as const,
    email: stableAuth.session.user.email || ''
  } : null);

  const isAuthenticated = !!finalUser || !!stableAuth.session;

  const contextValue: AuthContextType = {
    user: finalUser, 
    session: stableAuth.session, 
    login, 
    logout, 
    isAuthenticated, 
    authenticatedClient,
    isLoading: stableAuth.isLoading || !isInitialized,
    isAdmin: stableAuth.isAdmin
  };

  console.log('🔐 [AuthProvider] Providing context value:', {
    contextId: getAuthContextId(),
    hasUser: !!contextValue.user,
    userType: contextValue.user?.type,
    isAuthenticated: contextValue.isAuthenticated,
    isLoading: contextValue.isLoading
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
