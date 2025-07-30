import { logger } from './logger';

/**
 * Verifica se um JWT está expirado
 * @param token O token JWT a ser verificado
 * @returns true se o token estiver expirado, false caso contrário
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // Decodifica o JWT (sem verificar assinatura, apenas para checar exp)
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decoded = JSON.parse(jsonPayload);
    
    if (!decoded.exp) {
      logger.warn('🔍 [TokenUtils] Token sem campo exp, considerando válido');
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < currentTime;
    
    if (isExpired) {
      logger.warn('⏰ [TokenUtils] Token expirado:', {
        exp: decoded.exp,
        current: currentTime,
        expiresIn: decoded.exp - currentTime
      });
    }
    
    return isExpired;
  } catch (error) {
    logger.error('❌ [TokenUtils] Erro ao verificar expiração do token:', error);
    return true; // Se não conseguir decodificar, considera expirado
  }
};

/**
 * Obtém o tempo restante até a expiração do token em segundos
 * @param token O token JWT a ser verificado
 * @returns Segundos restantes até expiração, ou 0 se expirado/inválido
 */
export const getTokenTimeToExpire = (token: string): number => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return 0;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decoded = JSON.parse(jsonPayload);
    
    if (!decoded.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    
    return Math.max(0, timeLeft);
  } catch (error) {
    logger.error('❌ [TokenUtils] Erro ao obter tempo de expiração:', error);
    return 0;
  }
};