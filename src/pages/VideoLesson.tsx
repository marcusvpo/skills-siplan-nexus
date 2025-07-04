import React from 'react';
import Layout from '@/components/Layout';
import { useParams } from 'react-router-dom';
import { useSupabaseDataWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import VideoPlayer from '@/user/VideoPlayer';

const VideoLesson = () => {
  const { systemId, productId, videoId } = useParams();
  const { videoAulas } = useSupabaseDataWithAccess(systemId, productId);
  const video = videoAulas?.find((v: any) => v.id === videoId);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-12 page-transition">
        {video ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-white">{video.title}</h1>
            <VideoPlayer videoUrl={video.url} />
            <p className="mt-4 text-muted-foreground">{video.description}</p>
          </>
        ) : (
          <p className="text-muted-foreground">Vídeo não encontrado.</p>
        )}
      </div>
    </Layout>
  );
};

export default VideoLesson;
