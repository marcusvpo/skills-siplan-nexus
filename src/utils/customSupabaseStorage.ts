
export const customCartorioStorage = {
  getItem: (key: string): string | null => {
    console.log(`🔍 [CustomStorage] Tentando LEITURA para a chave: "${key}"`);
    
    try {
      const localStorage_value = localStorage.getItem(key);
      const sessionStorage_value = sessionStorage.getItem(key);
      
      console.log(`📦 [CustomStorage] LocalStorage para "${key}": ${localStorage_value ? 'ENCONTRADO' : 'NULL'}`);
      console.log(`🗃️ [CustomStorage] SessionStorage para "${key}": ${sessionStorage_value ? 'ENCONTRADO' : 'NULL'}`);
      
      // Debug adicional: mostrar todas as chaves do localStorage
      const allKeys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('token') || k.includes('supabase'));
      console.log(`🔑 [CustomStorage] Todas as chaves auth no localStorage:`, allKeys);
      
      const result = localStorage_value || sessionStorage_value || null;
      
      if (result) {
        console.log(`✅ [CustomStorage] LEITURA BEM-SUCEDIDA para "${key}". Conteúdo: ${result.length > 100 ? result.substring(0, 100) + '...' : result}`);
        try {
          const parsed = JSON.parse(result);
          console.log(`   Conteúdo do token: accessToken presente: ${!!parsed.access_token}, refreshToken presente: ${!!parsed.refresh_token}`);
        } catch (e) {
          console.log(`   Valor não é um JSON válido.`);
        }
      } else {
        console.log(`❌ [CustomStorage] LEITURA - Chave "${key}" não encontrada.`);
      }
      
      return result;
    } catch (error) {
      console.error(`🚨 [CustomStorage] ERRO na leitura para "${key}":`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    console.log(`💾 [CustomStorage] Tentando ESCRITA para a chave: "${key}"`);
    
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
      
      // Verificar se salvou corretamente
      const localStorage_saved = localStorage.getItem(key);
      const sessionStorage_saved = sessionStorage.getItem(key);
      
      if (localStorage_saved === value) {
        console.log(`✅ [CustomStorage] ESCRITA BEM-SUCEDIDA para "${key}". Valor salvo: ${value.length > 100 ? value.substring(0, 100) + '...' : value}`);
        try {
          const parsed = JSON.parse(value);
          console.log(`   Conteúdo do token: accessToken presente: ${!!parsed.access_token}, refreshToken presente: ${!!parsed.refresh_token}`);
        } catch (e) {
          console.log(`   Valor não é um JSON válido.`);
        }
      } else {
        console.warn(`⚠️ [CustomStorage] ESCRITA POTENCIALMENTE FALHA para "${key}". Valor lido não corresponde ao salvo.`);
      }
      
      console.log(`✅ [CustomStorage] VERIFICAÇÃO SessionStorage - Salvou?`, !!sessionStorage_saved);
      
      // Debug: mostrar todas as chaves após salvar
      const allKeys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('token') || k.includes('supabase'));
      console.log(`🔑 [CustomStorage] Chaves após salvar:`, allKeys);
      
    } catch (error) {
      console.error(`🚨 [CustomStorage] ERRO na escrita para "${key}":`, error);
    }
  },
  
  removeItem: (key: string): void => {
    console.log(`🗑️ [CustomStorage] Tentando REMOÇÃO para a chave: "${key}"`);
    
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      
      if (!localStorage.getItem(key)) {
        console.log(`✅ [CustomStorage] REMOÇÃO BEM-SUCEDIDA para "${key}".`);
      } else {
        console.warn(`⚠️ [CustomStorage] REMOÇÃO POTENCIALMENTE FALHA para "${key}".`);
      }
    } catch (error) {
      console.error(`🚨 [CustomStorage] ERRO na remoção para "${key}":`, error);
    }
  }
};
