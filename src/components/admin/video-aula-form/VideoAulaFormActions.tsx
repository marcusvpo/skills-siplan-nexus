
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface VideoAulaFormActionsProps {
  isLoading: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

export const VideoAulaFormActions: React.FC<VideoAulaFormActionsProps> = ({
  isLoading,
  isEdit,
  onCancel
}) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        {isEdit ? 'Atualizar' : 'Criar'} Videoaula
      </Button>
    </div>
  );
};
