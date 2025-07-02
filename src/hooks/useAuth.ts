
import { useContext } from 'react';
import { AuthContext, debugAuthContext, getAuthContextId } from '@/contexts/AuthContextSingleton';

export const useAuth = () => {
  console.log('🔐 [useAuth] Hook called');
  debugAuthContext('useAuth');
  
  const context = useContext(AuthContext);
  
  console.log('🔐 [useAuth] Context received:', {
    hasContext: !!context,
    contextId: getAuthContextId(),
    hasUser: !!context?.user,
    userType: context?.user?.type,
    isAuthenticated: context?.isAuthenticated,
    isLoading: context?.isLoading,
    contextReference: AuthContext
  });
  
  if (context === undefined) {
    console.error('❌ [useAuth] Context is undefined!');
    console.error('❌ [useAuth] AuthContext ID:', getAuthContextId());
    console.error('❌ [useAuth] AuthContext reference:', AuthContext);
    
    // Mais debug específico
    console.error('❌ [useAuth] Available React contexts:', Object.keys(React));
    console.error('❌ [useAuth] Component stack trace:');
    console.trace();
    
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
