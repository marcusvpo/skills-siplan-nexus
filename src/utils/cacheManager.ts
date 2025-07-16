
export class CacheManager {
  static clearAppCache(): void {
    console.log('🧹 [CacheManager] Limpando cache da aplicação');
    
    try {
      // Limpar localStorage relacionado à auth
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-') || key.startsWith('video_timer_')) {
          localStorage.removeItem(key);
          console.log('🧹 [CacheManager] Removido do localStorage:', key);
        }
      });
      
      // Limpar sessionStorage
      sessionStorage.clear();
      console.log('🧹 [CacheManager] SessionStorage limpo');
      
      console.log('✅ [CacheManager] Cache limpo com sucesso');
    } catch (error) {
      console.error('❌ [CacheManager] Erro ao limpar cache:', error);
    }
  }

  static clearVideoTimer(videoaulaId: string): void {
    try {
      localStorage.removeItem(`video_timer_${videoaulaId}`);
      console.log('🧹 [CacheManager] Timer limpo para videoaula:', videoaulaId);
    } catch (error) {
      console.error('❌ [CacheManager] Erro ao limpar timer:', error);
    }
  }

  static forceReload(): void {
    console.log('🔄 [CacheManager] Forçando reload da página');
    window.location.reload();
  }

  static clearCacheAndReload(): void {
    this.clearAppCache();
    setTimeout(() => this.forceReload(), 500);
  }
}
