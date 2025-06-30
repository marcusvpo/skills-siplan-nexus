
import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const AdminSearchBar: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectResult = (tipo: string, id: string) => {
    switch (tipo) {
      case 'sistema':
        navigate('/admin', { state: { selectedSystem: id } });
        break;
      case 'produto':
        navigate('/admin', { state: { selectedProduct: id } });
        break;
      case 'video_aula':
        navigate(`/editar-videoaula/${id}`);
        break;
      default:
        toast({
          title: "Navegação não implementada",
          description: `Navegação para ${tipo} ainda não está disponível.`,
          variant: "default",
        });
    }
  };

  return (
    <SearchBar
      onSelectResult={handleSelectResult}
      placeholder="Buscar conteúdo para administrar..."
      className="w-full max-w-lg"
    />
  );
};
