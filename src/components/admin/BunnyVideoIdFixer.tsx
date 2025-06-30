
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, AlertCircle } from 'lucide-react';
import { useBunnyVideoIdFixer } from '@/hooks/useBunnyVideoIdFixer';

export const BunnyVideoIdFixer: React.FC = () => {
  const { fixBunnyVideoIds, isFixing } = useBunnyVideoIdFixer();

  const handleFix = async () => {
    const result = await fixBunnyVideoIds();
    
    if (result && result.results) {
      console.log('Fix results:', result.results);
      
      // Show detailed results to admin
      const failedItems = result.results.filter(r => !r.success);
      if (failedItems.length > 0) {
        console.warn('Failed to fix some items:', failedItems);
      }
    }
  };

  return (
    <Card className="bg-yellow-900/20 border-yellow-600">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Corretor de IDs da Bunny.net
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm">
          Esta ferramenta analisa as videoaulas que estão com o campo <code>bunny_video_id</code> vazio 
          e tenta extrair automaticamente o ID do vídeo a partir da URL armazenada.
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleFix}
            disabled={isFixing}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Wrench className="h-4 w-4 mr-2" />
            {isFixing ? 'Corrigindo IDs...' : 'Corrigir IDs da Bunny.net'}
          </Button>
          
          {isFixing && (
            <div className="text-yellow-400 text-sm">
              Processando videoaulas...
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-400">
          <strong>Nota:</strong> Esta operação é segura e apenas preenche campos vazios. 
          Não modifica dados existentes.
        </div>
      </CardContent>
    </Card>
  );
};
