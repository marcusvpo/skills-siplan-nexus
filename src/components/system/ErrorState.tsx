
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-800/50 border-red-600 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-4">{title}</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="space-y-2">
              {onRetry && (
                <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700 w-full">
                  Tentar Novamente
                </Button>
              )}
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full"
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
