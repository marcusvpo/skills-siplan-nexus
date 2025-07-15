import React, { createContext, useContext, useCallback, useState } from 'react';

interface ProgressContextType {
  refreshAll: () => void;
  refreshKey: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgressContext = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: React.ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAll = useCallback(() => {
    console.log('🔄 [ProgressContext] Invalidando todos os caches de progresso');
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <ProgressContext.Provider value={{ refreshAll, refreshKey }}>
      {children}
    </ProgressContext.Provider>
  );
};