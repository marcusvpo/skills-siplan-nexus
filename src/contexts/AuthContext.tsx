import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Ajuste o import baseado no seu arquivo real
import { supabase } from '../lib/client'; // ou o caminho correto do seu arquivo

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
            email: session.user.email
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
            email: session.user.email
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

  const login = async (username: string, loginToken: string): Promise<any> => {
    console.log('🚀 [AuthContext] Starting login process...');
    console.log('📝 [AuthContext] Username:', username);
    console.log('🔑 [AuthContext] Token present:', !!loginToken);
    
    try {
      setIsLoading(true);
      
      console.log('📡 [AuthContext] Calling Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('login', {
        body: {
          username: username.trim(),
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
      
      // Aqui você pode definir o estado de autenticação se necessário
      // setUser(data.user);
      
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
    isLoading
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