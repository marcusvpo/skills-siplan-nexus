
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';
import { useCartoriosAdmin } from '@/hooks/useCartoriosAdmin';
import { useAdminAuth } from '@/hooks/useAdminAuthFixed';
import { toast } from '@/hooks/use-toast';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioEditor } from './CartorioEditor';
import { CartorioFormDialog } from './CartorioFormDialog';
import { CartorioCard } from './CartorioCard';
import { CartorioEmptyState } from './CartorioEmptyState';

const CartorioManagerFixed: React.FC = () => {
  const [isNewCartorioOpen, setIsNewCartorioOpen] = useState(false);
  const [selectedCartorioForUsers, setSelectedCartorioForUsers] = useState<any>(null);
  const [selectedCartorioForEdit, setSelectedCartorioForEdit] = useState<any>(null);

  const { isAdmin, isLoading: authLoading, error: authError, session } = useAdminAuth();
  const { data: cartorios = [], isLoading, error, refetch } = useCartoriosAdmin();

  useEffect(() => {
    logger.info('🏢 [CartorioManagerFixed] Component mounted', { 
      cartoriosCount: cartorios.length,
      isLoading,
      hasError: !!error,
      isAdmin,
      authLoading,
      hasSession: !!session
    });
  }, [cartorios.length, isLoading, error, isAdmin, authLoading, session]);

  useEffect(() => {
    if (error) {
      logger.error('❌ [CartorioManagerFixed] Error loading cartorios:', { error });
      toast({
        title: "Erro ao carregar cartórios",
        description: "Não foi possível carregar a lista de cartórios. Verifique as permissões administrativas.",
        variant: "destructive",
      });
    }
  }, [error]);

  useEffect(() => {
    if (authError) {
      logger.error('❌ [CartorioManagerFixed] Auth error:', { error: authError });
      toast({
        title: "Erro de autenticação",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {authLoading ? 'Verificando permissões...' : 'Carregando cartórios...'}
          </p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Acesso negado</h3>
          <p className="text-gray-400 text-center mb-4">
            Você precisa ter permissões administrativas para acessar esta seção.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-400 text-center mb-4">
            Não foi possível carregar os cartórios. Verifique sua conexão e permissões.
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Cartórios</h2>
          <p className="text-gray-400">Gerencie cartórios e seus acessos à plataforma</p>
          {session && (
            <p className="text-xs text-green-400 mt-1">
              Logado como: {session.user?.email}
            </p>
          )}
        </div>
        <Button 
          onClick={() => setIsNewCartorioOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartório
        </Button>
      </div>

      {/* Lista de cartórios */}
      <div className="grid grid-cols-1 gap-6">
        {cartorios.length === 0 ? (
          <CartorioEmptyState onCreateClick={() => setIsNewCartorioOpen(true)} />
        ) : (
          cartorios.map((cartorio, index) => (
            <CartorioCard
              key={cartorio.id}
              numero={index + 1}
              cartorio={cartorio}
              onEditCartorio={setSelectedCartorioForEdit}
              onManageUsers={setSelectedCartorioForUsers}
            />
          ))
        )}
      </div>

      {/* Form Dialog */}
      <CartorioFormDialog
        isOpen={isNewCartorioOpen}
        onClose={() => setIsNewCartorioOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Modal de gerenciamento de usuários */}
      {selectedCartorioForUsers && (
        <CartorioUserManager
          cartorioId={selectedCartorioForUsers.id}
          cartorioName={selectedCartorioForUsers.nome}
          isOpen={!!selectedCartorioForUsers}
          onClose={() => setSelectedCartorioForUsers(null)}
        />
      )}

      {/* Modal de edição de cartório */}
      {selectedCartorioForEdit && (
        <CartorioEditor
          cartorio={selectedCartorioForEdit}
          isOpen={!!selectedCartorioForEdit}
          onClose={() => setSelectedCartorioForEdit(null)}
          onUpdate={() => {
            refetch();
            setSelectedCartorioForEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default CartorioManagerFixed;
