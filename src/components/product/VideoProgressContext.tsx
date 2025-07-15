import React, { createContext, useContext, useCallback } from 'react';

interface VideoProgressContextType {
  refreshProgress: () => void;
}

const VideoProgressContext = createContext<VideoProgressContextType | undefined>(undefined);

export const useVideoProgress = () => {
  const context = useContext(VideoProgressContext);
  if (!context) {
    throw new Error('useVideoProgress must be used within a VideoProgressProvider');
  }
  return context;
};

interface VideoProgressProviderProps {
  children: React.ReactNode;
  onProgressUpdate: () => void;
}

export const VideoProgressProvider: React.FC<VideoProgressProviderProps> = ({ 
  children, 
  onProgressUpdate 
}) => {
  const refreshProgress = useCallback(() => {
    onProgressUpdate();
  }, [onProgressUpdate]);

  return (
    <VideoProgressContext.Provider value={{ refreshProgress }}>
      {children}
    </VideoProgressContext.Provider>
  );
};