import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

interface Cartorio {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

interface Props {
  cartorio: Cartorio;
  onSelecionar: (id: string) => void;
}

const CartorioCard: React.FC<Props> = ({ cartorio, onSelecionar }) => {
  return (
    <Card className="gradient-card p-6 hover:shadow-elevated transition-all duration-300 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Building2 className="w-8 h-8 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {cartorio.nome}
          </h3>
          <p className="text-sm text-gray-400">
            {cartorio.cidade} - {cartorio.estado}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onSelecionar(cartorio.id)}
          className="btn-hover-lift border-gray-600 text-white hover:border-red-600"
        >
          Acessar
        </Button>
      </div>
    </Card>
  );
};

export default CartorioCard;
