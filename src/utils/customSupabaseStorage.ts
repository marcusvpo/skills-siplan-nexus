
export const customCartorioStorage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      console.log(`🔍 [CustomStorage] Getting ${key}:`, item ? 'Found' : 'Not found');
      return item;
    } catch (error) {
      console.error(`❌ [CustomStorage] Error getting ${key}:`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      console.log(`✅ [CustomStorage] Set ${key}:`, value.substring(0, 50) + '...');
    } catch (error) {
      console.error(`❌ [CustomStorage] Error setting ${key}:`, error);
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ [CustomStorage] Removed ${key}`);
    } catch (error) {
      console.error(`❌ [CustomStorage] Error removing ${key}:`, error);
    }
  }
};
