import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  email?: string;
  // Adicione outros campos conforme necessário
}

interface AuthContextType {
  user: User | null;
  login: (username: string, loginToken: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há uma sessão ativa ao carregar o app
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Session check error:', error);
        } else if (session?.user) {
          console.log('✅ [AuthContext] Active session found');
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || '',
            email: session.user.email
          });
        }
      } catch (error) {
        console.error('❌ [AuthContext] Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthContext] Auth state changed:', event);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email || '',
            email: session.user.email
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, loginToken: string) => {
    try {
      console.log('🔍 [AuthContext] Starting login process');
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('login-cartorio', {
        body: { username, login_token: loginToken }
      });

      if (error) {
        console.error('❌ [AuthContext] Edge Function error:', error);
        throw new Error(error.message || 'Erro na autenticação');
      }

      if (!data?.success) {
        console.error('❌ [AuthContext] Login failed:', data);
        throw new Error(data?.error || 'Credenciais inválidas');
      }

      console.log('✅ [AuthContext] Login successful:', data);
      
      // Se a Edge Function retornar dados do usuário, definir aqui
      if (data.user) {
        setUser(data.user);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ [AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 [AuthContext] Starting logout process');
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
    isAuthenticated: !!user
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

export default AuthContext;