
import { useState, useCallback } from 'react';
import { createAuthenticatedClient } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  jwtToken?: string;
  cartorio_id?: string;
  cartorio_name?: string;
  username?: string;
  email?: string;
}

interface CartorioLoginData {
  username: string;
  cartorio_id?: string;
  cartorio_name?: string;
  email?: string;
}

export const useCartorioAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);

  const loginCartorio = useCallback(async (token: string, userData: CartorioLoginData): Promise<User> => {
    logger.info('🔐 [useCartorioAuth] Starting cartorio login', { 
      username: userData.username,
      cartorio_id: userData.cartorio_id
    });

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

      // Criar usuário com dados completos
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

      // Criar cliente autenticado
      const authClient = createAuthenticatedClient(authData.token);
      
      // Atualizar estados
      setUser(newUser);
      setAuthenticatedClient(authClient);
      
      // Salvar no localStorage
      localStorage.setItem('siplan-user', JSON.stringify(newUser));

      logger.info('✅ [useCartorioAuth] Cartorio login successful', {
        cartorio_id: newUser.cartorio_id,
        cartorio_name: newUser.cartorio_name,
        username: newUser.username
      });

      return newUser;
    } catch (error) {
      logger.error('❌ [useCartorioAuth] Cartorio login failed:', error);
      throw error;
    }
  }, []);

  const restoreSavedUser = useCallback(() => {
    const savedUser = localStorage.getItem('siplan-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        
        if (userData.type === 'cartorio' && userData.jwtToken) {
          setUser(userData);
          const authClient = createAuthenticatedClient(userData.jwtToken);
          setAuthenticatedClient(authClient);
          
          logger.info('🔐 [useCartorioAuth] Restored cartorio user from localStorage:', {
            cartorio_id: userData.cartorio_id,
            username: userData.username
          });
          
          return userData;
        }
      } catch (err) {
        logger.error('❌ [useCartorioAuth] Error restoring saved user:', err);
        localStorage.removeItem('siplan-user');
      }
    }
    return null;
  }, []);

  const clearCartorioAuth = useCallback(() => {
    setUser(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
    logger.info('🔐 [useCartorioAuth] Cartorio auth cleared');
  }, []);

  return {
    user,
    authenticatedClient,
    loginCartorio,
    restoreSavedUser,
    clearCartorioAuth
  };
};
