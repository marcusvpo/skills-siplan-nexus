
export const debugAuthState = (context: string, state: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [${context}] Auth Debug`);
    console.log('Session:', state.session ? 'Present' : 'Null');
    console.log('User:', state.user ? state.user.email : 'Null');
    console.log('Loading:', state.loading);
    console.log('Initialized:', state.isInitialized);
    console.log('Is Admin:', state.isAdmin);
    if (state.session) {
      console.log('Token expires:', new Date(state.session.expires_at * 1000));
      
      // Analisar JWT payload
      try {
        const jwtPayload = JSON.parse(atob(state.session.access_token.split('.')[1]));
        console.log('JWT Role:', jwtPayload.role);
        console.log('JWT Sub:', jwtPayload.sub);
        console.log('JWT Email:', jwtPayload.email);
      } catch (error) {
        console.error('Error parsing JWT:', error);
      }
    }
    console.groupEnd();
  }
};

export const debugSupabaseClient = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔧 [Supabase] Client Debug');
    console.log('URL:', 'https://bnulocsnxiffavvabfdj.supabase.co');
    console.log('Client initialized:', 'Yes');
    console.log('Auth persistence:', 'Enabled');
    console.log('Auto refresh:', 'Enabled');
    console.groupEnd();
  }
};
