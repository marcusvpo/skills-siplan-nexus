
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, RefreshCw, Trash2, Users, Shield, Edit, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/utils/logger';
import { useCartoriosAdminFixed } from '@/hooks/useCartoriosAdminFixed';
import { toast } from '@/hooks/use-toast';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioEditor } from './CartorioEditor';
import { CartorioFormDialog } from './CartorioFormDialog';
import { CartorioPermissionsManager } from './CartorioPermissionsManager';

const CartorioManagerRestored: React.FC = () => {
  const [isNewCartorioOpen, setIsNewCartorioOpen] = useState(false);
  const [selectedCartorioForUsers, setSelectedCartorioForUsers] = useState<any>(null);
  const [selectedCartorioForEdit, setSelectedCartorioForEdit] = useState<any>(null);
  const [selectedCartorioForPermissions, setSelectedCartorioForPermissions] = useState<any>(null);

  const { cartorios, isLoading, error, refetch, deleteCartorio } = useCartoriosAdminFixed();

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
          cartorios.map((cartorio) => (
            <Card key={cartorio.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white mb-1">
                      {cartorio.nome}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      {cartorio.cidade && cartorio.estado && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {cartorio.cidade}, {cartorio.estado}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(cartorio.data_cadastro).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    {/* Tokens de acesso */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-300 mb-2">Tokens de Acesso:</p>
                      {cartorio.acessos_cartorio?.length > 0 ? (
                        <div className="space-y-1">
                          {cartorio.acessos_cartorio.map((acesso) => (
                            <div key={acesso.id} className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                              <span className="text-xs font-mono text-gray-300">
                                {acesso.login_token.substring(0, 20)}...
                              </span>
                              <div className="flex space-x-2">
                                <Badge 
                                  variant={acesso.ativo ? 'secondary' : 'destructive'}
                                  className={`text-xs ${acesso.ativo ? 'bg-green-600' : ''}`}
                                >
                                  {acesso.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {new Date(acesso.data_expiracao).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Nenhum token configurado</p>
                      )}
                    </div>

                    {/* Usuários */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-300">
                        Usuários: {cartorio.cartorio_usuarios?.filter(u => u.is_active).length || 0} ativos
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={cartorio.is_active ? 'secondary' : 'destructive'}
                    className={cartorio.is_active ? 'bg-green-600 text-white' : ''}
                  >
                    {cartorio.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {cartorio.observacoes && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {cartorio.observacoes}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setSelectedCartorioForEdit(cartorio)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedCartorioForUsers(cartorio)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Usuários
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedCartorioForPermissions(cartorio)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-300 hover:bg-blue-700/20"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Permissões
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteCartorio(cartorio)}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-300 hover:bg-red-700/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
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
