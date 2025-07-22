
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, setCartorioAuthContext, clearCartorioAuthContext } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useStableAuth } from '@/hooks/useStableAuth';
import { logger } from '@/utils/logger';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  cartorio_id?: string;
  cartorio_name?: string;
  username?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authenticatedClient: any;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  const stableAuth = useStableAuth();

  // Monitor Supabase session changes directly
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug(`AuthContextFixed: Auth state change event: ${event}`, { hasSession: !!session });
      
      if (session && session.user) {
        // Check if this is a cartorio login by looking at the JWT payload
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          logger.debug('AuthContextFixed: JWT payload decoded:', payload);
          
          if (payload.cartorio_id && payload.username) {
            // This is a cartorio user session
            const cartorioUser: User = {
              id: session.user.id,
              name: payload.username,
              type: 'cartorio',
              token: payload.login_token || '',
              cartorio_id: payload.cartorio_id,
              cartorio_name: payload.cartorio_nome || '',
              username: payload.username,
              email: session.user.email || ''
            };
            
            logger.info('🎯 AuthContextFixed: Setting cartorio user from session change', cartorioUser);
            setUser(cartorioUser);
            setSession(session);
            setCartorioAuthContext(payload.login_token || '');
            localStorage.setItem('siplan-user', JSON.stringify(cartorioUser));
            setIsLoadingAuth(false); // Critical: Stop loading state
            return;
          }
        } catch (e) {
          logger.debug('AuthContextFixed: Could not decode JWT payload, might be admin session');
        }
      }
      
      // If we get here, either no session or admin session
      setSession(session);
      if (!session) {
        setUser(null);
        clearCartorioAuthContext();
        localStorage.removeItem('siplan-user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial auth check
  useEffect(() => {
    let isMounted = true;

    const performInitialAuthCheck = async () => {
      logger.debug('AuthContextFixed: Starting initial auth check...');
      
      // 1. Try to restore cartorio user from localStorage
      const savedUser = localStorage.getItem('siplan-user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.type === 'cartorio' && userData.token) {
            if (isMounted) {
              setUser(userData);
              setCartorioAuthContext(userData.token);
              logger.info('📦 AuthContextFixed: Cartorio user restored from localStorage');
              setIsLoadingAuth(false);
              setInitializationComplete(true);
              return;
            }
          } else {
            localStorage.removeItem('siplan-user');
          }
        } catch (err) {
          logger.error('❌ AuthContextFixed: Error parsing localStorage user:', err);
          localStorage.removeItem('siplan-user');
        }
      }

      // 2. Wait for stableAuth to initialize
      if (!stableAuth.isInitialized) {
        logger.debug('⏳ AuthContextFixed: Waiting for stableAuth to initialize...');
        return;
      }

      // 3. Check for admin session
      if (stableAuth.session?.user && stableAuth.isAdmin) {
        const adminUser: User = {
          id: stableAuth.session.user.id,
          name: 'Administrador',
          type: 'admin',
          email: stableAuth.session.user.email || ''
        };
        if (isMounted) {
          setUser(adminUser);
          setSession(stableAuth.session);
          clearCartorioAuthContext();
          logger.info('👤 AuthContextFixed: Admin user synchronized from stableAuth');
        }
      } else {
        if (isMounted) {
          setUser(null);
          setSession(null);
          clearCartorioAuthContext();
          logger.info('🚫 AuthContextFixed: No active session to synchronize');
        }
      }
      
      if (isMounted) {
        setIsLoadingAuth(false);
        setInitializationComplete(true);
      }
    };

    performInitialAuthCheck();

    return () => {
      isMounted = false;
    };
  }, [stableAuth.isInitialized, stableAuth.session, stableAuth.isAdmin]);

  const login = async (usernameOrToken: string, type: 'cartorio' | 'admin', userData?: Partial<User>): Promise<void> => {
    setIsLoadingAuth(true);
    logger.info('🔐 AuthContextFixed: Login called', { type, usernameOrToken, userData: !!userData });

    try {
      if (type === 'cartorio') {
        logger.debug('AuthContextFixed: Starting cartorio login via Edge Function...');
        
        const response = await fetch(`https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`
          },
          body: JSON.stringify({ username: usernameOrToken, login_token: userData?.token || '' })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'HTTP Error' }));
          logger.error('❌ AuthContextFixed: Edge Function login error:', errorData);
          throw new Error(errorData.error || 'Authentication error');
        }

        const data = await response.json();
        logger.debug('AuthContextFixed: Edge Function response received:', data);

        if (!data.success) {
          logger.error('❌ AuthContextFixed: Edge Function login failed:', data.error);
          throw new Error(data.error || 'Authentication error');
        }

        // Set Supabase session with tokens from Edge Function
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        
        logger.debug('AuthContextFixed: supabase.auth.setSession completed. Error:', sessionError);

        if (sessionError) {
          logger.error('❌ AuthContextFixed: Error setting Supabase session:', sessionError);
          throw new Error('Error setting session');
        }

        // Note: The user state will be set by the onAuthStateChange listener above
        // This ensures consistency with the session state
        logger.info('✅ AuthContextFixed: Cartorio login completed successfully');
        
      } else {
        logger.warn('⚠️ AuthContextFixed: Direct admin login called (should handle via stableAuth)');
      }
    } catch (error) {
      logger.error('❌ AuthContextFixed: Error during login process:', error);
      setIsLoadingAuth(false); // Make sure to stop loading on error
      throw error;
    }
    // Note: setIsLoadingAuth(false) will be called by onAuthStateChange when session is established
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    logger.info('🔐 AuthContextFixed: Logout called');

    try {
      if (user?.type === 'admin') {
        await stableAuth.logout();
      } else {
        await supabase.auth.signOut();
        clearCartorioAuthContext();
        localStorage.removeItem('siplan-user');
      }
      setUser(null);
      setSession(null);
      logger.info('✅ AuthContextFixed: Logout completed successfully');
    } catch (error) {
      logger.error('❌ AuthContextFixed: Error during logout:', error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const isAuthenticated = !!user || !!stableAuth.session;
  const isLoading = isLoadingAuth;
  const authenticatedClient = supabase;

  // Debug logging
  useEffect(() => {
    logger.debug('🔍 DEBUG: AuthContextFixed state:', {
      userPresent: !!user,
      userType: user?.type,
      hasSupabaseSession: !!session,
      hasStableAuthSession: !!stableAuth.session,
      isAdminFromStableAuth: stableAuth.isAdmin,
      isUserAuthenticated: isAuthenticated,
      isAuthLoading: isLoading,
      initializationComplete,
      stableAuthIsLoading: stableAuth.loading,
      stableAuthIsInitialized: stableAuth.isInitialized
    });
  }, [user, session, stableAuth.session, stableAuth.isAdmin, isAuthenticated, isLoading, initializationComplete, stableAuth.loading, stableAuth.isInitialized]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session: session || stableAuth.session,
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading, 
      isAdmin: user?.type === 'admin' || stableAuth.isAdmin
    }}>
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
