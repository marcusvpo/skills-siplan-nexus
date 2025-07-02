
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface ProductProgressProps {
  productId: string;
  className?: string;
}

interface ProgressData {
  total_aulas: number;
  aulas_concluidas: number;
  percentual: number;
}

export const ProductProgress: React.FC<ProductProgressProps> = ({ productId, className = '' }) => {
  const { user, authenticatedClient } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.cartorio_id || !productId || !authenticatedClient) {
        setIsLoading(false);
        return;
      }

      try {
        logger.info('📊 [ProductProgress] Fetching progress', {
          productId,
          cartorioId: user.cartorio_id,
          hasAuthClient: !!authenticatedClient
        });

        // Debug: verificar estado do authenticatedClient
        logger.info('📊 [ProductProgress] Auth client state', {
          clientType: typeof authenticatedClient,
          hasHeaders: !!authenticatedClient.headers,
          hasAuth: !!(authenticatedClient.headers?.Authorization || authenticatedClient.headers?.authorization)
        });

        const { data, error } = await authenticatedClient
          .rpc('get_product_progress', {
            p_produto_id: productId,
            p_cartorio_id: user.cartorio_id
          });

        if (error) {
          logger.error('❌ [ProductProgress] Error fetching progress:', { 
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details
          });
        } else {
          // Cast the Json response to ProgressData via unknown
          const progressData = data as unknown as ProgressData;
          setProgress(progressData);
          logger.info('✅ [ProductProgress] Progress fetched', { progress: progressData });
        }
      } catch (err) {
        logger.error('❌ [ProductProgress] Unexpected error:', { 
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [productId, user?.cartorio_id, authenticatedClient]);

  if (!user?.cartorio_id || isLoading) {
    return null;
  }

  if (!progress || progress.total_aulas === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">Progresso:</span>
        <span className="text-gray-300">
          {progress.percentual}% ({progress.aulas_concluidas}/{progress.total_aulas} aulas)
        </span>
      </div>
      <Progress 
        value={progress.percentual} 
        className="h-2"
      />
    </div>
  );
};
