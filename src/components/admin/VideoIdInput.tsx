
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, AlertCircle } from 'lucide-react';

interface VideoIdInputProps {
  videoId: string;
  onVideoIdChange: (value: string) => void;
  onFetchVideo: () => void;
  isLoading: boolean;
  disabled: boolean;
  error: string | null;
}

export const VideoIdInput: React.FC<VideoIdInputProps> = ({
  videoId,
  onVideoIdChange,
  onFetchVideo,
  isLoading,
  disabled,
  error
}) => {
  const validateVideoId = (id: string): boolean => {
    // UUID format validation (Bunny.net video IDs are UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id.trim());
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
            onChange={(e) => onVideoIdChange(e.target.value)}
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
            onClick={onFetchVideo}
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
    </div>
  );
};
