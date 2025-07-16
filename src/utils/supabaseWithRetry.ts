
import { supabase, getValidSession } from '@/integrations/supabase/client';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';

export class SupabaseWithRetry {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 segundos
  private static readonly MAX_RETRIES = 3;

  static async signInWithPassword(credentials: SignInWithPasswordCredentials, timeout: number = this.DEFAULT_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log('🔐 [SupabaseWithRetry] Tentando login com timeout de', timeout + 'ms');
      
      const response = await supabase.auth.signInWithPassword(credentials);
      
      clearTimeout(timeoutId);
      console.log('✅ [SupabaseWithRetry] Login bem-sucedido');
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('❌ [SupabaseWithRetry] Login timeout');
        throw new Error('Login timeout - tente novamente');
      }
      
      console.error('❌ [SupabaseWithRetry] Erro no login:', error);
      throw error;
    }
  }

  static async getSessionWithRetry(retries: number = this.MAX_RETRIES): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 [SupabaseWithRetry] Tentativa ${attempt} de obter sessão`);
        
        const validSession = await getValidSession();
        
        if (validSession) {
          console.log('✅ [SupabaseWithRetry] Sessão válida obtida');
          return { data: { session: validSession }, error: null };
        } else {
          console.log('⚠️ [SupabaseWithRetry] Nenhuma sessão válida encontrada');
          return { data: { session: null }, error: null };
        }
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [SupabaseWithRetry] Tentativa ${attempt} falhou:`, error);
        
        if (attempt < retries) {
          // Backoff exponencial: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`⏳ [SupabaseWithRetry] Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ [SupabaseWithRetry] Todas as tentativas falharam');
    return { data: { session: null }, error: lastError };
  }
}
