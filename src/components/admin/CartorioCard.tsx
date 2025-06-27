
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Key, 
  Calendar, 
  Mail, 
  MapPin,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  Users,
  Edit2,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartorioCardProps {
  cartorio: any;
  onEditCartorio: (cartorio: any) => void;
  onManageUsers: (cartorio: any) => void;
}

export const CartorioCard: React.FC<CartorioCardProps> = ({
  cartorio,
  onEditCartorio,
  onManageUsers
}) => {
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Token copiado",
      description: "O token foi copiado para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isTokenExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  const isTokenExpiringSoon = (expirationDate: string) => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            {cartorio.nome}
            {cartorio.is_active ? (
              <Badge variant="secondary" className="ml-2 bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2 bg-red-600 text-white">
                <XCircle className="h-3 w-3 mr-1" />
                Inativo
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {cartorio.acessos_cartorio?.length || 0} acessos
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditCartorio(cartorio)}
              className="border-blue-600 text-blue-400 hover:bg-blue-700/20"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManageUsers(cartorio)}
              className="border-green-600 text-green-400 hover:bg-green-700/20"
            >
              <Settings className="h-4 w-4 mr-1" />
              Usuários
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do cartório */}
          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Informações
            </h4>
            <div className="space-y-2 text-sm">
              {cartorio.cidade && cartorio.estado && (
                <div className="flex items-center text-gray-300">
                  <span className="font-medium">Localização:</span>
                  <span className="ml-2">{cartorio.cidade}, {cartorio.estado}</span>
                </div>
              )}
              <div className="flex items-center text-gray-300">
                <span className="font-medium">Cadastrado em:</span>
                <span className="ml-2">{formatDate(cartorio.data_cadastro)}</span>
              </div>
              {cartorio.observacoes && (
                <div className="text-gray-300">
                  <span className="font-medium">Observações:</span>
                  <p className="mt-1 text-gray-400">{cartorio.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tokens de acesso */}
          <div className="space-y-3">
            <h4 className="text-white font-medium flex items-center">
              <Key className="h-4 w-4 mr-2" />
              Tokens de Acesso
            </h4>
            <div className="space-y-3">
              {cartorio.acessos_cartorio?.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum token de acesso encontrado</p>
              ) : (
                cartorio.acessos_cartorio?.map((acesso: any) => (
                  <div
                    key={acesso.id}
                    className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {acesso.ativo ? (
                          <Badge variant="secondary" className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-600 text-white">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                        {isTokenExpired(acesso.data_expiracao) && (
                          <Badge variant="destructive">Expirado</Badge>
                        )}
                        {isTokenExpiringSoon(acesso.data_expiracao) && (
                          <Badge variant="secondary" className="bg-yellow-600 text-white">
                            Expira em breve
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Token:</span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-600 px-2 py-1 rounded text-xs text-white">
                            {showTokens[acesso.id] 
                              ? acesso.login_token 
                              : '•'.repeat(20)
                            }
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTokenVisibility(acesso.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showTokens[acesso.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToken(acesso.login_token)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Mail className="h-3 w-3 mr-2" />
                        <span>{acesso.email_contato}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-3 w-3 mr-2" />
                        <span>Expira em: {formatDate(acesso.data_expiracao)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
