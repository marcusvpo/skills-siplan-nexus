
import React from 'react';
import { VideoAulaCard } from './VideoAulaCard';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulasGridProps {
  videoAulas: VideoAula[];
  isDeleting: string | null;
  onEdit: (videoAula: VideoAula) => void;
  onDelete: (id: string, title: string) => void;
  onEditWYSIWYG: (videoAula: VideoAula) => void;
}

export const VideoAulasGrid: React.FC<VideoAulasGridProps> = ({
  videoAulas,
  isDeleting,
  onEdit,
  onDelete,
  onEditWYSIWYG
}) => {
  if (videoAulas.length === 0) {
    return (
      <div className="text-center py-12 page-transition">
        <div className="text-6xl mb-6 animate-bounce">🎬</div>
        <p className="text-gray-400 text-lg mb-2 text-enhanced">Nenhuma videoaula cadastrada neste produto</p>
        <p className="text-gray-500 text-sm">
          Clique em "Editor WYSIWYG" ou "Cadastrar Nova Videoaula" para começar
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 page-transition">
      {videoAulas.map((videoAula, index) => (
        <div
          key={videoAula.id}
          className="card-enter"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <VideoAulaCard
            videoAula={videoAula}
            isDeleting={isDeleting === videoAula.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onEditWYSIWYG={onEditWYSIWYG}
          />
        </div>
      ))}
    </div>
  );
};
