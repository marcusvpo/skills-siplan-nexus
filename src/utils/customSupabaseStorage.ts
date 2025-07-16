
export const customCartorioStorage = {
  getItem: (key: string): string | null => {
    console.log('🔍 [CustomStorage] TENTANDO LER:', key);
    
    try {
      const localStorage_value = localStorage.getItem(key);
      const sessionStorage_value = sessionStorage.getItem(key);
      
      console.log('📦 [CustomStorage] LocalStorage para', key, ':', localStorage_value ? 'ENCONTRADO' : 'NULL');
      console.log('🗃️ [CustomStorage] SessionStorage para', key, ':', sessionStorage_value ? 'ENCONTRADO' : 'NULL');
      
      // Debug adicional: mostrar todas as chaves do localStorage
      const allKeys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('token') || k.includes('supabase'));
      console.log('🔑 [CustomStorage] Todas as chaves auth no localStorage:', allKeys);
      
      const result = localStorage_value || sessionStorage_value || null;
      console.log('✅ [CustomStorage] RESULTADO FINAL para', key, ':', result ? 'ENCONTRADO' : 'NULL');
      
      return result;
    } catch (error) {
      console.error('❌ [CustomStorage] Erro ao ler', key, ':', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    console.log('💾 [CustomStorage] SALVANDO:', key, 'valor:', value?.substring(0, 50) + '...');
    
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
      
      // Verificar se salvou corretamente
      const localStorage_saved = localStorage.getItem(key);
      const sessionStorage_saved = sessionStorage.getItem(key);
      
      console.log('✅ [CustomStorage] VERIFICAÇÃO LocalStorage - Salvou?', !!localStorage_saved);
      console.log('✅ [CustomStorage] VERIFICAÇÃO SessionStorage - Salvou?', !!sessionStorage_saved);
      
      // Debug: mostrar todas as chaves após salvar
      const allKeys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('token') || k.includes('supabase'));
      console.log('🔑 [CustomStorage] Chaves após salvar:', allKeys);
      
    } catch (error) {
      console.error('❌ [CustomStorage] Erro ao salvar:', error);
    }
  },
  
  removeItem: (key: string): void => {
    console.log('🗑️ [CustomStorage] REMOVENDO:', key);
    
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      
      console.log('✅ [CustomStorage] Removido do localStorage e sessionStorage');
    } catch (error) {
      console.error('❌ [CustomStorage] Erro ao remover:', error);
    }
  }
};
