
import React from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';

interface LoadingStateProps {
  message: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <Layout>
      <div className="page-transition flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/60 px-10 py-8 backdrop-blur-md">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="absolute inset-0 animate-ping rounded-xl bg-primary/10" />
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </Layout>
  );
};

export default LoadingState;
