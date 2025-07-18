
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  type: 'admin' | 'cartorio';
  cartorio_id?: string;
  cartorio_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (loginToken: string, userType: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 [AuthContext] Initializing...');
    
    // Verificar sessão existente
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Session check error:', error);
        } else if (session?.user) {
          console.log('✅ [AuthContext] Active session found:', session.user);
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.username || session.user.email || '',
            email: session.user.email,
            type: session.user.user_metadata?.type || 'cartorio',
            cartorio_id: session.user.user_metadata?.cartorio_id,
            cartorio_name: session.user.user_metadata?.cartorio_name
          });
        } else {
          console.log('ℹ️ [AuthContext] No active session');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [AuthContext] Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || '',
            name: session.user.user_metadata?.name || session.user.user_metadata?.username || session.user.email || '',
            email: session.user.email,
            type: session.user.user_metadata?.type || 'cartorio',
            cartorio_id: session.user.user_metadata?.cartorio_id,
            cartorio_name: session.user.user_metadata?.cartorio_name
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (loginToken: string, userType: string): Promise<any> => {
    console.log('🚀 [AuthContext] Starting login process...');
    console.log('🔑 [AuthContext] Token present:', !!loginToken);
    console.log('👤 [AuthContext] User type:', userType);
    
    try {
      setIsLoading(true);
      
      console.log('📡 [AuthContext] Calling Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('login-cartorio', {
        body: {
          login_token: loginToken.trim()
        }
      });

      console.log('📨 [AuthContext] Edge Function response:', { data, error });

      if (error) {
        console.error('❌ [AuthContext] Edge Function error:', error);
        throw new Error(error.message || 'Erro na autenticação');
      }

      if (!data || !data.success) {
        console.error('❌ [AuthContext] Authentication failed:', data);
        throw new Error(data?.message || 'Credenciais inválidas');
      }

      console.log('✅ [AuthContext] Login successful:', data);
      
      // Se recebeu token JWT customizado, configurar no Supabase
      if (data.jwt_token) {
        console.log('🔐 [AuthContext] Setting custom JWT token');
        // Aqui você pode configurar o token customizado se necessário
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ [AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🚪 [AuthContext] Logging out...');
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [AuthContext] Logout error:', error);
        throw error;
      }
      setUser(null);
      console.log('✅ [AuthContext] Logout successful');
    } catch (error) {
      console.error('❌ [AuthContext] Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.type === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
