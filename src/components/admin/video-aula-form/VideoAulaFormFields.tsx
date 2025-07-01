
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VideoAulaFormData } from './types';

interface VideoAulaFormFieldsProps {
  formData: VideoAulaFormData;
  setFormData: React.Dispatch<React.SetStateAction<VideoAulaFormData>>;
}

export const VideoAulaFormFields: React.FC<VideoAulaFormFieldsProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="titulo" className="text-gray-300">Título da Videoaula *</Label>
          <Input
            id="titulo"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
            placeholder="Ex: Introdução ao Sistema"
            required
          />
        </div>
        <div>
          <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
            className="bg-gray-700/50 border-gray-600 text-white focus:border-red-500 focus:ring-red-500/20"
            min="1"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="url_video" className="text-gray-300">URL do Vídeo *</Label>
        <Input
          id="url_video"
          value={formData.url_video}
          onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
          placeholder="https://exemplo.com/video"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="id_video_bunny" className="text-gray-300">ID Bunny</Label>
        <Input
          id="id_video_bunny"
          value={formData.id_video_bunny}
          onChange={(e) => setFormData({ ...formData, id_video_bunny: e.target.value })}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
          placeholder="ID do vídeo no Bunny.net"
        />
      </div>
      
      <div>
        <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
          placeholder="Descrição da videoaula..."
          rows={3}
        />
      </div>
    </>
  );
};
