
import React, { useState } from 'react';
import { VideoAulaFormFixed } from './VideoAulaFormFixed';
import { VideoAulasHeader } from './video-aulas/VideoAulasHeader';
import { VideoAulasGrid } from './video-aulas/VideoAulasGrid';
import { useVideoAulasActions } from './video-aulas/useVideoAulasActions';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulasListFixedProps {
  sistema: Sistema;
  produto: Produto;
  videoAulas: VideoAula[];
  onVideoAulasChange: () => void;
  onBack: () => void;
}

export const VideoAulasListFixed: React.FC<VideoAulasListFixedProps> = ({
  sistema,
  produto,
  videoAulas,
  onVideoAulasChange,
  onBack
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVideoAula, setEditingVideoAula] = useState<VideoAula | null>(null);

  const { isDeleting, handleDelete, handleCreateNew, handleEditWYSIWYG } = useVideoAulasActions(
    sistema,
    produto,
    onVideoAulasChange
  );

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideoAula(null);
    onVideoAulasChange();
  };

  const handleEdit = (videoAula: VideoAula) => {
    setEditingVideoAula(videoAula);
    setShowForm(true);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <VideoAulasHeader
        sistema={sistema}
        produto={produto}
        onBack={onBack}
        onCreateNew={handleCreateNew}
        onShowForm={handleShowForm}
      />

      {showForm && (
        <VideoAulaFormFixed
          sistema={sistema}
          produto={produto}
          videoAula={editingVideoAula}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingVideoAula(null);
          }}
        />
      )}

      <VideoAulasGrid
        videoAulas={videoAulas}
        isDeleting={isDeleting}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onEditWYSIWYG={handleEditWYSIWYG}
      />
    </div>
  );
};
