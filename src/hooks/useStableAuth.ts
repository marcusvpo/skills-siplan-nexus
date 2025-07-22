import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAdmin: boolean;
  error: string | null;
}

export const useStableAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true, // Começa como true para indicar que a verificação está em andamento
    isInitialized: false, // Começa como false para indicar que a inicialização não terminou
    isAdmin: false,
    error: null
  });

  const initializationRef = useRef(false); // Garante que a inicialização só aconteça uma vez
  const listenerRef = useRef<any>(null); // Referência para a inscrição do listener

  // Função para verificar status de admin com cache
  const checkAdminStatus = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user?.email) {
      // Adicionado log para clareza
      logger.debug('🔍 [useStableAuth] checkAdminStatus: Usuário sem email, retornando false para admin.');
      return false;
    }

    const cacheKey = `admin_status_${user.email}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      logger.debug(`⚙️ [useStableAuth] checkAdminStatus: Status admin para ${user.email} do cache: ${cached}`);
      return cached === 'true';
    }

    try {
      logger.debug(`🔍 [useStableAuth] checkAdminStatus: Verificando status admin para ${user.email} no DB.`);
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 é 'Not found'
        logger.error('❌ [useStableAuth] Erro ao verificar status admin:', { error });
        return false;
      }

      const isAdmin = !!adminData;
      sessionStorage.setItem(cacheKey, isAdmin.toString()); // Salva no cache
      logger.debug(`✅ [useStableAuth] checkAdminStatus: Status admin para ${user.email} do DB: ${isAdmin}`);
      return isAdmin;
    } catch (err) {
      logger.error('❌ [useStableAuth] Erro inesperado ao verificar admin:', { error: err });
      return false;
    }
  }, []);

  // Função para validar se a sessão do Supabase ainda é válida
  const isSessionValid = useCallback((session: Session | null): boolean => {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    // Considera a sessão válida se expira em mais de 5 minutos
    return expiresAt > (now + 300); 
  }, []);

  // Função central para atualizar o estado de autenticação de forma estável
  const updateAuthState = useCallback(async (session: Session | null, source: string = 'unknown') => {
    logger.debug(`🔄 [useStableAuth] Atualizando estado auth (source: ${source}):`, { hasSession: !!session });
    
    let currentSession = session;

    // Tenta refreshar a sessão se ela não for válida
    if (currentSession && !isSessionValid(currentSession)) {
      logger.debug('⚠️ [useStableAuth] Sessão expirada ou quase expirando, tentando refresh...');
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (!error && data.session) {
          currentSession = data.session;
          logger.debug('✅ [useStableAuth] Sessão refreshada com sucesso.');
        } else {
          logger.warn('❌ [useStableAuth] Falha ao refreshar sessão, invalidando-a.', { error });
          currentSession = null; // Invalida a sessão se não puder ser refreshada
        }
      } catch (err) {
        logger.error('❌ [useStableAuth] Erro ao refreshar sessão:', err);
        currentSession = null;
      }
    }
    
    const isAdmin = currentSession?.user ? await checkAdminStatus(currentSession.user) : false;
    logger.debug(`🎯 [useStableAuth] updateAuthState: isAdmin determinado: ${isAdmin} para usuário email: ${currentSession?.user?.email || 'N/A'}`);

    const newState: AuthState = {
      session: currentSession,
      user: currentSession?.user || null,
      loading: false, // O processo de atualização terminou, então não está mais "carregando"
      isInitialized: true, // A inicialização do hook terminou
      isAdmin,
      error: null // Limpa qualquer erro anterior após a atualização
    };

    logger.debug('📝 [useStableAuth] Novo estado auth antes de setar:', {
      hasSession: !!newState.session,
      hasUser: !!newState.user,
      loading: newState.loading,
      isInitialized: newState.isInitialized,
      isAdmin: newState.isAdmin,
      source
    });

    setAuthState(newState);

    // Salva a sessão no localStorage apenas se ela for válida
    if (currentSession && isSessionValid(currentSession)) {
      try {
        localStorage.setItem('supabase.auth.token', JSON.stringify(currentSession));
        logger.debug('💾 [useStableAuth] Sessão Supabase salva no localStorage.');
      }  catch (error) {
        logger.error('❌ [useStableAuth] Erro ao salvar sessão no localStorage:', error);
      }
    } else {
      localStorage.removeItem('supabase.auth.token'); // Remove se a sessão não é válida
      logger.debug('🗑️ [useStableAuth] Sessão Supabase removida do localStorage.');
    }
  }, [checkAdminStatus, isSessionValid]);

  // Efeito para a inicialização única e estável do hook
  useEffect(() => {
    if (initializationRef.current) return; // Garante que só roda uma vez
    
    initializationRef.current = true;
    logger.info('🚀 [useStableAuth] Iniciando verificação de autenticação...');

    const initAuth = async () => {
      try {
        logger.debug('🔍 [useStableAuth] Obtendo sessão do Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('❌ [useStableAuth] Erro ao obter sessão inicial:', error);
          await updateAuthState(null, 'init-error');
          return;
        }

        logger.debug('✅ [useStableAuth] Sessão inicial obtida:', { hasSession: !!session });
        await updateAuthState(session, 'init'); // Atualiza o estado com o session inicial

      } catch (error) {
        logger.error('❌ [useStableAuth] Erro durante a inicialização do auth:', error);
        await updateAuthState(null, 'init-exception');
      }
    };

    initAuth(); // Chama a função de inicialização
  }, [updateAuthState]); // Depende de updateAuthState

  // Efeito para configurar o listener de mudanças de autenticação do Supabase
  useEffect(() => {
    // Garante que o listener só é configurado se a inicialização já ocorreu e não há um listener ativo
    if (!initializationRef.current || listenerRef.current) return;

    logger.info('👂 [useStableAuth] Configurando listener de mudanças de autenticação...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.debug(`🔔 [useStableAuth] Evento Auth recebido: ${event}`, { hasSession: !!session });
        // Sempre atualiza o estado em resposta a qualquer evento de autenticação
        await updateAuthState(session, `event-${event}`);
      }
    );

    listenerRef.current = subscription; // Armazena a inscrição do listener

    // Função de limpeza para desinscrever o listener na desmontagem
    return () => {
      logger.info('🧹 [useStableAuth] Limpando listener de autenticação.');
      subscription.unsubscribe();
      listenerRef.current = null;
    };
  }, [updateAuthState]); // Depende de updateAuthState

  // Função para fazer logout do Supabase Auth nativo
  const logout = useCallback(async () => {
    try {
      logger.info('🚪 [useStableAuth] Realizando logout...');
      await supabase.auth.signOut();
      sessionStorage.clear(); // Limpa o cache de status de admin
      localStorage.removeItem('supabase.auth.token'); // Remove a sessão do localStorage
      logger.info('✅ [useStableAuth] Logout concluído.');
    } catch (err) {
      logger.error('❌ [useStableAuth] Erro durante o logout:', { error: err });
    }
  }, []); // Sem dependências, pois apenas chama funções já estáveis

  // Retorna o estado atual e a função de logout
  return {
    ...authState,
    logout,
    updateAuthState // ESTA LINHA É CRÍTICA! ELA ESTAVA FALTANDO.
  };
};