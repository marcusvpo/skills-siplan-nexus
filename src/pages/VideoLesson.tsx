import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import Layout from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const VideoLesson = () => {
  const { id } = useParams();
  const { videoAula, loading } = useSupabaseData(id);

  return (
    <Layout>
      <div className="min-h-screen page-transition bg-gradient-to-br from-[#2a2a2a] via-[#1c1c1c] to-black text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {loading ? (
            <>
              <Skeleton className="h-10 w-1/2 mb-4" />
              <Skeleton className="aspect-video w-full rounded-lg mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
                {videoAula?.titulo}
              </h1>

              <div className="aspect-video mb-6">
                <iframe
                  src={videoAula?.url}
                  title="Videoaula"
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full rounded-lg shadow-elevated"
                />
              </div>

              <p className="text-gray-300 whitespace-pre-line">{videoAula?.descricao}</p>

              <div className="mt-8 text-right">
                <Button
                  onClick={() => window.history.back()}
                  className="btn-hover-lift bg-red-600 hover:bg-red-700 text-white"
                >
                  Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VideoLesson;
