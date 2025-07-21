import React from 'react';
import Layout from '@/components/Layout';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';

const Debug: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Debug Panel</h1>
          <AuthDebugPanel />
        </div>
      </div>
    </Layout>
  );
};

export default Debug;