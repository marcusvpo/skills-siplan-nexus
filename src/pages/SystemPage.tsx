import React from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { useSupabaseDataWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import VideoAulasList from '@/components/product/VideoAulasList';

const SystemPage = () => {
  const { systemId } = useParams();
  const { videoAulas } = useSupabaseDataWithAccess(systemId);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 page-transition">
        <h1 className="text-2xl font-bold mb-6 text-white">Vídeo Aulas do Sistema</h1>
        <Card className="p-4 bg-card text-card-foreground shadow-modern gradient-card">
          <VideoAulasList
            videoAulas={videoAulas}
            systemId={systemId}
            productId={null}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default SystemPage;
