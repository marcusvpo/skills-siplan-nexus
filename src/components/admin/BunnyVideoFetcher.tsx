
import React, { useState } from 'react';
import { useBunnyVideoDetails } from '@/hooks/useBunnyVideoDetails';
import { VideoIdInput } from './VideoIdInput';
import { VideoDetailsCard } from './VideoDetailsCard';

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

  return (
    <div className="space-y-4">
      <VideoIdInput
        videoId={videoId}
        onVideoIdChange={handleInputChange}
        onFetchVideo={handleFetchVideo}
        isLoading={isLoading}
        disabled={disabled}
        error={error}
      />

      {videoDetails && (
        <VideoDetailsCard videoDetails={videoDetails} />
      )}
    </div>
  );
};
