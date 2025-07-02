
// DEPRECATED: This file is being replaced by the singleton pattern
// Import from AuthContextSingleton and AuthProvider instead

export { AuthContext, debugAuthContext, getAuthContextId } from './AuthContextSingleton';
export { AuthProvider } from './AuthProvider';

// Re-export types for backward compatibility
export type { User, CartorioLoginData, AuthContextType } from './AuthContextSingleton';
