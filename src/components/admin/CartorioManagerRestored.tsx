
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, RefreshCw, Trash2, Users, Shield, Edit, Calendar, MapPin, Copy, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/utils/logger';
import { useCartoriosAdminFixed } from '@/hooks/useCartoriosAdminFixed';
import { useCartorioSessions } from '@/hooks/useCartorioSessions';
import { toast } from '@/hooks/use-toast';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioEditor } from './CartorioEditor';
import { CartorioFormDialog } from './CartorioFormDialog';
import { CartorioPermissionsManager } from './CartorioPermissionsManager';
import { CartorioCard } from './CartorioCard';

const CartorioManagerRestored: React.FC = () => {
  const [isNewCartorioOpen, setIsNewCartorioOpen] = useState(false);
  const [selectedCartorioForUsers, setSelectedCartorioForUsers] = useState<any>(null);
  const [selectedCartorioForEdit, setSelectedCartorioForEdit] = useState<any>(null);
  const [selectedCartorioForPermissions, setSelectedCartorioForPermissions] = useState<any>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  const { cartorios, isLoading, error, refetch, deleteCartorio } = useCartoriosAdminFixed();
  const sessions = useCartorioSessions();

  const handleDeleteCartorio = async (cartorio: any) => {
    if (!window.confirm(`Tem certeza que deseja deletar o cartório "${cartorio.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteCartorio(cartorio.id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: "Token copiado!",
        description: "O token foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o token.",
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando cartórios...</p>
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
          <p className="text-gray-400 text-center mb-4">{error}</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Cartórios</h2>
          <p className="text-gray-400">Gerencie cartórios, usuários e permissões de acesso</p>
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
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum cartório encontrado</h3>
                <p className="text-gray-400 mb-4">Comece criando seu primeiro cartório</p>
                <Button 
                  onClick={() => setIsNewCartorioOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Cartório
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          cartorios.map((cartorio) => {
            const sessionData = sessions.get(cartorio.id);
            return (
              <CartorioCard
                key={cartorio.id}
                cartorio={cartorio}
                sessionData={sessionData || null}
                onEditCartorio={(c) => setSelectedCartorioForEdit(c)}
                onManageUsers={(c) => setSelectedCartorioForUsers(c)}
                onManageAccess={(c) => setSelectedCartorioForPermissions(c)}
              />
            );
          })
        )}
      </div>

      {/* Modals */}
      <CartorioFormDialog
        isOpen={isNewCartorioOpen}
        onClose={() => setIsNewCartorioOpen(false)}
        onSuccess={() => refetch()}
      />

      {selectedCartorioForUsers && (
        <CartorioUserManager
          cartorioId={selectedCartorioForUsers.id}
          cartorioName={selectedCartorioForUsers.nome}
          isOpen={!!selectedCartorioForUsers}
          onClose={() => setSelectedCartorioForUsers(null)}
        />
      )}

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

      {selectedCartorioForPermissions && (
        <CartorioPermissionsManager
          cartorio={selectedCartorioForPermissions}
          isOpen={!!selectedCartorioForPermissions}
          onClose={() => setSelectedCartorioForPermissions(null)}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
};

export default CartorioManagerRestored;
