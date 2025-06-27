
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VideoAulaFormFixed } from '@/components/admin/VideoAulaFormFixed';

const NovaVideoaula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sistemaId = searchParams.get('sistema_id');
  const produtoId = searchParams.get('produto_id');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <VideoAulaFormFixed 
          sistemaId={sistemaId}
          produtoId={produtoId}
        />
      </div>
    </Layout>
  );
};

export default NovaVideoaula;
