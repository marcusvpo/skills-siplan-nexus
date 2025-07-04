
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Shield, Calendar, MapPin } from 'lucide-react';

interface CartorioCardProps {
  cartorio: any;
  onEditCartorio: (cartorio: any) => void;
  onManageUsers: (cartorio: any) => void;
  onManageAccess?: (cartorio: any) => void;
}

export const CartorioCard: React.FC<CartorioCardProps> = ({
  cartorio,
  onEditCartorio,
  onManageUsers,
  onManageAccess
}) => {
  return (
    <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 card-enter btn-hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-white mb-2 text-enhanced">
              {cartorio.nome}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
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
          </div>
          <Badge 
            variant={cartorio.is_active ? 'secondary' : 'destructive'}
            className={cartorio.is_active ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-modern' : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-modern'}
          >
            {cartorio.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {cartorio.observacoes && (
          <div className="mb-4 p-3 glass-effect rounded-lg border border-gray-600/50">
            <p className="text-sm text-gray-400 line-clamp-2">
              {cartorio.observacoes}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onEditCartorio(cartorio)}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift shadow-modern"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          
          <Button
            onClick={() => onManageUsers(cartorio)}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-300 hover:bg-blue-700/20 btn-hover-lift shadow-modern"
          >
            <Users className="h-4 w-4 mr-1" />
            Usuários
          </Button>
          
          {onManageAccess && (
            <Button
              onClick={() => onManageAccess(cartorio)}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-300 hover:bg-red-700/20 btn-hover-lift shadow-modern"
            >
              <Shield className="h-4 w-4 mr-1" />
              Acesso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
