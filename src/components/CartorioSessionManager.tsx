import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useCartorioSessionHeartbeat } from '@/hooks/useCartorioSessionHeartbeat';

/**
 * Componente invisível que gerencia a sessão do cartório
 * Deve ser incluído no Dashboard do cartório
 */
export const CartorioSessionManager = () => {
  const { user } = useAuth();
  
  // Ativar heartbeat apenas para usuários do tipo cartório
  const cartorioId = user?.type === 'cartorio' ? user.cartorio_id : null;
  useCartorioSessionHeartbeat(cartorioId || null);
  
  return null; // Componente invisível
};
