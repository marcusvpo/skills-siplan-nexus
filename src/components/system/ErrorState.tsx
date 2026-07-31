
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title, message, onRetry }) => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="page-transition flex min-h-[70vh] items-center justify-center px-4">
        <Card className="max-w-md border-destructive/30">
          <CardContent className="p-8 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </span>
            <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{message}</p>
            <div className="space-y-2">
              {onRetry && (
                <Button onClick={onRetry} variant="glow" className="w-full">
                  Tentar Novamente
                </Button>
              )}
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ErrorState;
