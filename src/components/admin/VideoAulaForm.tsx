
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { VideoAulaFormProps } from './video-aula-form/types';
import { useVideoAulaForm } from './video-aula-form/useVideoAulaForm';
import { VideoAulaFormFields } from './video-aula-form/VideoAulaFormFields';
import { VideoAulaFormActions } from './video-aula-form/VideoAulaFormActions';

export const VideoAulaForm: React.FC<VideoAulaFormProps> = ({
  sistema,
  produto,
  videoAula,
  onSuccess,
  onCancel
}) => {
  const { formData, setFormData, isLoading, handleSubmit } = useVideoAulaForm(videoAula, produto);

  return (
    <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {videoAula ? 'Editar Videoaula' : 'Nova Videoaula'}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-gray-700/30 rounded border border-gray-600">
          <p className="text-gray-300 text-sm">
            <strong>Sistema:</strong> {sistema.nome} • <strong>Produto:</strong> {produto.nome}
          </p>
        </div>
        
        <form onSubmit={(e) => handleSubmit(e, onSuccess)} className="space-y-4">
          <VideoAulaFormFields formData={formData} setFormData={setFormData} />
          <VideoAulaFormActions 
            isLoading={isLoading} 
            isEdit={!!videoAula} 
            onCancel={onCancel} 
          />
        </form>
      </CardContent>
    </Card>
  );
};
