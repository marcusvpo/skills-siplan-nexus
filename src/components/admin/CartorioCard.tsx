
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Shield, Calendar, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { CartorioStatusIndicator } from './CartorioStatusIndicator';

interface CartorioCardProps {
  numero: number;
  cartorio: any;
  onEditCartorio: (cartorio: any) => void;
  onManageUsers: (cartorio: any) => void;
  onManageAccess?: (cartorio: any) => void;
  sessionData?: {
    last_activity: string;
    is_active: boolean;
  } | null;
}

export const CartorioCard: React.FC<CartorioCardProps> = ({
  numero,
  cartorio,
  onEditCartorio,
  onManageUsers,
  onManageAccess,
  sessionData
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 card-enter btn-hover-lift">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-400 flex-shrink-0">#{numero}</span>
                <div className="flex-1 min-w-0 text-left">
                  <CardTitle className="text-base text-white text-enhanced truncate">
                    {cartorio.nome}
                  </CardTitle>
                </div>
                <div className="flex-shrink-0">
                  <CartorioStatusIndicator
                    lastActivity={sessionData?.last_activity || null}
                    isActive={sessionData?.is_active || false}
                  />
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-300">
          <CardContent className="pt-0 space-y-3">
            {/* Nome completo do cartório */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-white">
                {cartorio.nome}
              </h4>
              <Badge 
                variant={cartorio.is_active ? 'secondary' : 'destructive'}
                className={cartorio.is_active ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-modern flex-shrink-0' : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-modern flex-shrink-0'}
              >
                {cartorio.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            {/* Localização */}
            {cartorio.cidade && cartorio.estado && (
              <div className="flex items-center text-sm text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                {cartorio.cidade}, {cartorio.estado}
              </div>
            )}

            {/* Data de cadastro */}
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(cartorio.data_cadastro).toLocaleDateString('pt-BR')}
            </div>

            {/* Token de acesso */}
            {cartorio.acessos_cartorio?.[0]?.login_token && (
              <div className="p-3 glass-effect rounded-lg border border-gray-600/50">
                <p className="text-xs text-gray-400 mb-1">Token de Acesso</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blue-300 font-mono flex-1 truncate">
                    {cartorio.acessos_cartorio[0].login_token}
                  </code>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(cartorio.acessos_cartorio[0].login_token);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-blue-300 h-7 w-7 p-0 flex-shrink-0"
                    title="Copiar token"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </Button>
                </div>
              </div>
            )}

            {/* Observações */}
            {cartorio.observacoes && (
              <div className="p-3 glass-effect rounded-lg border border-gray-600/50">
                <p className="text-sm text-gray-400">
                  {cartorio.observacoes}
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCartorio(cartorio);
                }}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift shadow-modern"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onManageUsers(cartorio);
                }}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-300 hover:bg-blue-700/20 btn-hover-lift shadow-modern"
              >
                <Users className="h-4 w-4 mr-1" />
                Usuários
              </Button>
              
              {onManageAccess && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageAccess(cartorio);
                  }}
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
