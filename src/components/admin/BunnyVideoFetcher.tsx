
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useBunnyVideoDetails } from '@/hooks/useBunnyVideoDetails';
import { Loader2, Search, Video, Clock, Eye, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface BunnyVideoFetcherProps {
  onVideoSelect: (details: BunnyVideoDetails) => void;
  initialVideoId?: string;
  disabled?: boolean;
}

export const BunnyVideoFetcher: React.FC<BunnyVideoFetcherProps> = ({
  onVideoSelect,
  initialVideoId = '',
  disabled = false
}) => {
  const [videoId, setVideoId] = useState(initialVideoId);
  const [videoDetails, setVideoDetails] = useState<BunnyVideoDetails | null>(null);
  
  const { fetchVideoDetails, isLoading, error } = useBunnyVideoDetails();

  const validateVideoId = (id: string): boolean => {
    // UUID format validation (Bunny.net video IDs are UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id.trim());
  };

  const handleFetchVideo = async () => {
    if (!videoId.trim()) {
      return;
    }

    if (!validateVideoId(videoId)) {
      return;
    }

    const details = await fetchVideoDetails(videoId.trim());
    if (details) {
      setVideoDetails(details);
      onVideoSelect(details);
    }
  };

  const handleInputChange = (value: string) => {
    setVideoId(value);
    // Clear video details when input changes
    if (videoDetails && value !== videoDetails.videoId) {
      setVideoDetails(null);
    }
  };

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

  const isValidId = videoId.trim() && validateVideoId(videoId);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Label htmlFor="bunny-video-id" className="text-gray-300">
            ID do Vídeo Bunny.net *
          </Label>
          <Input
            id="bunny-video-id"
            value={videoId}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ex: 12345678-abcd-efgh-ijkl-123456789012"
            className={`bg-gray-700 border-gray-600 text-white ${
              videoId && !isValidId ? 'border-red-500' : ''
            }`}
            disabled={disabled || isLoading}
          />
          {videoId && !isValidId && (
            <p className="text-red-400 text-sm mt-1">
              ID deve estar no formato UUID (ex: 12345678-abcd-efgh-ijkl-123456789012)
            </p>
          )}
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleFetchVideo}
            disabled={!isValidId || disabled || isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Buscar Vídeo
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      )}

      {videoDetails && (
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
      )}
    </div>
  );
};
