import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface CartorioUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  cartorio_id: string;
  cartorio_name?: string;
  token: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

type AuthUser = (CartorioUser & { type: 'cartorio' }) | (AdminUser & { type: 'admin' });

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  // Restore cartorio user from localStorage
  const restoreCartorioUser = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('siplan-user');
      if (savedUser) {
        const user: CartorioUser = JSON.parse(savedUser);
        if (user.token && user.cartorio_id) {
          logger.info('🔧 [useAuth] Restored cartorio user:', { username: user.username });
          return { ...user, type: 'cartorio' as const };
        }
      }
    } catch (error) {
      logger.error('❌ [useAuth] Error restoring cartorio user:', error);
      localStorage.removeItem('siplan-user');
    }
    return null;
  }, []);

  // Check admin status for Supabase users
  const checkAdminStatus = useCallback(async (user: User): Promise<(AdminUser & { type: 'admin' }) | null> => {
    try {
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !adminData) return null;

      return {
        id: user.id,
        name: adminData.nome || 'Admin',
        email: user.email || '',
        type: 'admin' as const
      };
    } catch (error) {
      logger.error('❌ [useAuth] Error checking admin status:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      logger.info('🚀 [useAuth] Initializing authentication...');
      
      // Check for cartorio user first
      const cartorioUser = restoreCartorioUser();
      if (cartorioUser) {
        setAuthState({
          user: cartorioUser,
          session: null,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: false,
        });
        return;
      }

      // Check for Supabase session (admin users)
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('❌ [useAuth] Session error:', error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (session?.user) {
          const adminUser = await checkAdminStatus(session.user);
          if (adminUser) {
            setAuthState({
              user: adminUser,
              session,
              isLoading: false,
              isAuthenticated: true,
              isAdmin: true,
            });
            return;
          }
        }

        // No valid user found
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      } catch (error) {
        logger.error('❌ [useAuth] Init error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, [restoreCartorioUser, checkAdminStatus]);

  // Listen to Supabase auth changes (for admin users only)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('🔔 [useAuth] Auth state changed:', { event, hasSession: !!session });
        
        // If we have a cartorio user, ignore Supabase auth changes
        if (authState.user?.type === 'cartorio') return;

        if (session?.user) {
          const adminUser = await checkAdminStatus(session.user);
          if (adminUser) {
            setAuthState({
              user: adminUser,
              session,
              isLoading: false,
              isAuthenticated: true,
              isAdmin: true,
            });
          } else {
            // User authenticated but not admin
            setAuthState({
              user: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              isAdmin: false,
            });
          }
        } else {
          // No session
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminStatus, authState.user?.type]);

  // Login cartorio user
  const loginCartorio = useCallback(async (username: string, token: string) => {
    logger.info('🔐 [useAuth] Cartorio login attempt:', { username });
    
    try {
      const response = await supabase.functions.invoke('login-cartorio', {
        body: { username, login_token: token }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Login failed');

      const userData = response.data.user;
      const cartorioUser: CartorioUser & { type: 'cartorio' } = {
        id: userData.id,
        username: userData.username,
        name: userData.nome || userData.username,
        email: userData.email,
        cartorio_id: userData.cartorio_id,
        cartorio_name: userData.cartorio_name,
        token: response.data.access_token,
        type: 'cartorio'
      };

      localStorage.setItem('siplan-user', JSON.stringify(cartorioUser));
      
      setAuthState({
        user: cartorioUser,
        session: null,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: false,
      });

      logger.info('✅ [useAuth] Cartorio login successful');
    } catch (error) {
      logger.error('❌ [useAuth] Cartorio login error:', error);
      throw error;
    }
  }, []);

  // Login admin user (via Supabase Auth)
  const loginAdmin = useCallback(async (email: string, password: string) => {
    logger.info('🔐 [useAuth] Admin login attempt:', { email });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      const adminUser = await checkAdminStatus(data.user);
      if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error('User is not an administrator');
      }

      setAuthState({
        user: adminUser,
        session: data.session,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: true,
      });

      logger.info('✅ [useAuth] Admin login successful');
    } catch (error) {
      logger.error('❌ [useAuth] Admin login error:', error);
      throw error;
    }
  }, [checkAdminStatus]);

  // Logout
  const logout = useCallback(async () => {
    logger.info('🚪 [useAuth] Logging out...');
    
    try {
      // Clear cartorio user data
      localStorage.removeItem('siplan-user');
      
      // Sign out from Supabase if admin
      if (authState.session) {
        await supabase.auth.signOut();
      }

      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });

      logger.info('✅ [useAuth] Logout successful');
    } catch (error) {
      logger.error('❌ [useAuth] Logout error:', error);
      throw error;
    }
  }, [authState.session]);

  return {
    ...authState,
    loginCartorio,
    loginAdmin,
    logout,
  };
};