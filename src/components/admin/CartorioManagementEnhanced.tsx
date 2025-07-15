
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Copy, 
  Edit2, 
  Save, 
  X, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useUpdateCartorio } from '@/hooks/useAdminStats';
import { EditTokenModal } from './EditTokenModal';
import { UserProgressDropdown } from './UserProgressDropdown';
import { supabase } from '@/integrations/supabase/client';

interface CartorioManagementEnhancedProps {
  cartorio: any;
  onUpdate: () => void;
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

const CartorioManagementEnhanced: React.FC<CartorioManagementEnhancedProps> = ({
  cartorio,
  onUpdate,
  isExpanded,
  onToggleExpansion
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nome: cartorio.nome,
    cidade: cartorio.cidade || '',
    estado: cartorio.estado || '',
    observacoes: cartorio.observacoes || '',
    is_active: cartorio.is_active ?? true
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateCartorio = useUpdateCartorio();

  const handleCopyToken = async () => {
    const token = cartorio.acessos_cartorio?.[0]?.login_token;
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        toast({
          title: "Token copiado!",
          description: "Token copiado para a área de transferência",
        });
      } catch (err) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o token",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveCartorio = async () => {
    try {
      await updateCartorio(cartorio.id, editData);
      setIsEditing(false);
      onUpdate();
      toast({
        title: "Cartório atualizado",
        description: "Dados do cartório foram salvos com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
      console.error('Error updating cartorio:', error);
    }
  };

  const handleDeleteCartorio = async () => {
    const confirmText = `Tem certeza que deseja deletar "${cartorio.nome}"? Esta ação é irreversível e removerá todos os dados associados (usuários, visualizações, favoritos).`;
    
    if (!confirm(confirmText)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Deletar em cascata: visualizações, favoritos, usuários, acessos e cartório
      const { error: visualizacoesError } = await supabase
        .from('visualizacoes_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: favoritosError } = await supabase
        .from('favoritos_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: usuariosError } = await supabase
        .from('cartorio_usuarios')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: acessosError } = await supabase
        .from('acessos_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: cartorioError } = await supabase
        .from('cartorios')
        .delete()
        .eq('id', cartorio.id);

      if (visualizacoesError || favoritosError || usuariosError || acessosError || cartorioError) {
        throw new Error('Erro ao deletar cartório e dados associados');
      }

      toast({
        title: "Cartório deletado",
        description: `O cartório "${cartorio.nome}" e todos os dados associados foram removidos`,
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting cartorio:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o cartório",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {/* Header do Cartório */}
        <div className="bg-gray-700/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpansion}
                className="text-gray-300 hover:text-white p-1"
              >
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editData.nome}
                      onChange={(e) => setEditData({...editData, nome: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Nome do cartório"
                    />
                    <div className="flex space-x-2">
                      <Input
                        value={editData.cidade}
                        onChange={(e) => setEditData({...editData, cidade: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Cidade"
                      />
                      <Input
                        value={editData.estado}
                        onChange={(e) => setEditData({...editData, estado: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Estado"
                      />
                    </div>
                    <Textarea
                      value={editData.observacoes}
                      onChange={(e) => setEditData({...editData, observacoes: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Observações"
                      rows={2}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editData.is_active}
                        onCheckedChange={(checked) => setEditData({...editData, is_active: checked})}
                      />
                      <span className="text-sm text-gray-300">Cartório Ativo</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-white flex items-center space-x-2">
                      <span>{cartorio.nome}</span>
                      <Badge 
                        variant={cartorio.is_active ? 'secondary' : 'destructive'}
                        className={cartorio.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                      >
                        {cartorio.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-400">
                      {cartorio.cidade && cartorio.estado ? `${cartorio.cidade}, ${cartorio.estado}` : 'Localização não informada'}
                    </p>
                    {cartorio.observacoes && (
                      <p className="text-xs text-gray-500 mt-1">{cartorio.observacoes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveCartorio} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <UserProgressDropdown 
                    cartorioId={cartorio.id}
                    cartorioName={cartorio.nome}
                  />
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDeleteCartorio}
                    disabled={isDeleting}
                    className="border-red-600 text-red-400 hover:bg-red-700/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="text-right">
                <p className="text-xs text-gray-400">Token:</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-sm text-gray-300">
                    {cartorio.acessos_cartorio?.[0]?.login_token || 'N/A'}
                  </p>
                  {cartorio.acessos_cartorio?.[0]?.login_token && (
                    <Button size="sm" variant="ghost" onClick={handleCopyToken}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={cartorio.acessos_cartorio?.[0]?.ativo ? 'secondary' : 'destructive'}
                  className={cartorio.acessos_cartorio?.[0]?.ativo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                >
                  {cartorio.acessos_cartorio?.[0]?.ativo ? 'Token Ativo' : 'Token Inativo'}
                </Badge>
                <div className="mt-1">
                  <p className="text-sm text-gray-300">
                    Expira: {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                      ? formatDate(cartorio.acessos_cartorio[0].data_expiracao)
                      : 'N/A'
                    }
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => setIsTokenModalOpen(true)} 
                    className="h-7 mt-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Editar Validade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        cartorio={cartorio}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default CartorioManagementEnhanced;
