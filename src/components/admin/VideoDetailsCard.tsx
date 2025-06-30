
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Eye, HardDrive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BunnyVideoDetails {
  success: boolean;
  videoId: string;
  title: string;
  playUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: number;
  encodeProgress: number;
  isPublic: boolean;
  resolution: {
    width: number;
    height: number;
  };
  uploadDate: string;
  views: number;
  storageSize: number;
}

interface VideoDetailsCardProps {
  videoDetails: BunnyVideoDetails;
}

export const VideoDetailsCard: React.FC<VideoDetailsCardProps> = ({ videoDetails }) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const getStatusBadge = (status: number, encodeProgress: number) => {
    if (status === 4) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pronto
        </Badge>
      );
    }
    if (status === 3) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processando ({encodeProgress}%)
        </Badge>
      );
    }
    if (status === 5) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    }
    return <Badge variant="secondary">Status {status}</Badge>;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {videoDetails.thumbnailUrl && (
            <img
              src={videoDetails.thumbnailUrl}
              alt="Thumbnail do vídeo"
              className="w-24 h-16 object-cover rounded border border-gray-600"
            />
          )}
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-orange-400" />
              <h4 className="text-white font-medium">{videoDetails.title}</h4>
              {getStatusBadge(videoDetails.status, videoDetails.encodeProgress)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Duração: {formatDuration(videoDetails.duration)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>Visualizações: {videoDetails.views}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <HardDrive className="h-3 w-3" />
                <span>Tamanho: {formatFileSize(videoDetails.storageSize)}</span>
              </div>
              
              <div>
                <span>Resolução: {videoDetails.resolution.width}x{videoDetails.resolution.height}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Play URL:</strong> {videoDetails.playUrl}</p>
              {videoDetails.thumbnailUrl && (
                <p><strong>Thumbnail URL:</strong> {videoDetails.thumbnailUrl}</p>
              )}
              <p><strong>Público:</strong> {videoDetails.isPublic ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
