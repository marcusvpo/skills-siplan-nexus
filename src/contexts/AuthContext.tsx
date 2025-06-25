
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAuthenticatedClient, supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  type: 'cartorio' | 'admin';
  token?: string;
  cartorio_id?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  authenticatedClient: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener for Supabase Auth (admin users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (adminData) {
            const adminUser: User = {
              id: adminData.id,
              name: adminData.nome || 'Administrador',
              type: 'admin',
              email: session.user.email || ''
            };
            setUser(adminUser);
            localStorage.setItem('siplan-user', JSON.stringify(adminUser));
          }
        } else {
          // Only clear if it's an admin user
          const savedUser = localStorage.getItem('siplan-user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            if (userData.type === 'admin') {
              setUser(null);
              localStorage.removeItem('siplan-user');
            }
          }
        }
        
        setSession(session);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setIsLoading(false);
    });

    // Check for existing cartório user in localStorage
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

    setIsLoading(false);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (token: string, type: 'cartorio' | 'admin', userData?: Partial<User>) => {
    const newUser: User = {
      id: userData?.id || '1',
      name: userData?.name || (type === 'cartorio' ? 'Cartório' : 'Administrador'),
      type,
      token: type === 'cartorio' ? token : undefined,
      cartorio_id: userData?.cartorio_id,
      email: userData?.email
    };
    
    setUser(newUser);
    localStorage.setItem('siplan-user', JSON.stringify(newUser));
    
    // Create authenticated client for cartorio users
    if (type === 'cartorio') {
      const authClient = createAuthenticatedClient(token);
      setAuthenticatedClient(authClient);
    }
  };

  const logout = async () => {
    // Sign out from Supabase Auth if it's an admin
    if (user?.type === 'admin') {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setSession(null);
    setAuthenticatedClient(null);
    localStorage.removeItem('siplan-user');
  };

  const isAuthenticated = !!user || !!session;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      isAuthenticated, 
      authenticatedClient,
      isLoading
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
