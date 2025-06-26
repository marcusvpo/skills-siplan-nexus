
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Copy, 
  Edit2, 
  Save, 
  X, 
  Calendar,
  ChevronDown,
  ChevronRight 
} from 'lucide-react';
import { useUpdateCartorio, useUpdateTokenExpiration } from '@/hooks/useAdminStats';

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
  const [newExpirationDate, setNewExpirationDate] = useState('');
  
  const updateCartorio = useUpdateCartorio();
  const updateTokenExpiration = useUpdateTokenExpiration();

  const handleCopyToken = async () => {
    const token = cartorio.acessos_cartorio?.[0]?.login_token;
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        toast.success('Token copiado para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar token');
      }
    }
  };

  const handleSaveCartorio = async () => {
    try {
      await updateCartorio(cartorio.id, editData);
      setIsEditing(false);
      onUpdate();
      toast.success('Cartório atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar cartório');
      console.error('Error updating cartorio:', error);
    }
  };

  const handleUpdateExpiration = async () => {
    if (!newExpirationDate) {
      toast.error('Selecione uma nova data de expiração');
      return;
    }

    try {
      await updateTokenExpiration(cartorio.id, newExpirationDate);
      setNewExpirationDate('');
      onUpdate();
      toast.success('Data de expiração atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar data de expiração');
      console.error('Error updating expiration:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
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
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
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
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="date"
                    value={newExpirationDate}
                    onChange={(e) => setNewExpirationDate(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white text-xs h-7"
                  />
                  <Button size="sm" onClick={handleUpdateExpiration} className="h-7">
                    <Calendar className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartorioManagementEnhanced;
