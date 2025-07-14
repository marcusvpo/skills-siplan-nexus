
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ExternalLink, Clock, Play } from 'lucide-react';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

interface VideoAulaCardProps {
  videoAula: VideoAula;
  isDeleting: boolean;
  onEdit: (videoAula: VideoAula) => void;
  onDelete: (id: string, title: string) => void;
  onEditWYSIWYG: (videoAula: VideoAula) => void;
}

export const VideoAulaCard: React.FC<VideoAulaCardProps> = ({
  videoAula,
  isDeleting,
  onEdit,
  onDelete,
  onEditWYSIWYG
}) => {
  return (
    <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1 bg-blue-600/20 rounded-full">
            <Play className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>#{videoAula.ordem}</span>
          </div>
        </div>
        <CardTitle className="text-white text-base line-clamp-2 leading-tight">
          {videoAula.titulo}
        </CardTitle>
        {videoAula.id_video_bunny && (
          <div className="flex justify-end">
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              Bunny.net
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditWYSIWYG(videoAula)}
            className="border-purple-600 text-purple-400 hover:bg-purple-700/20 w-full btn-hover-lift"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            WYSIWYG
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(videoAula)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-1 btn-hover-lift"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(videoAula.id, videoAula.titulo)}
              disabled={isDeleting}
              className="border-red-600 text-red-400 hover:bg-red-700/20 flex-1 btn-hover-lift"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
