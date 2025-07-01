
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, ArrowRight } from 'lucide-react';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
}

interface VideoAulasListProps {
  videoAulas: VideoAula[];
  systemId: string;
  productId: string;
}

const VideoAulasList: React.FC<VideoAulasListProps> = ({ videoAulas, systemId, productId }) => {
  const navigate = useNavigate();

  if (videoAulas.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">🎥</div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhuma videoaula disponível</h3>
          <p className="text-gray-400 mb-6">
            As videoaulas para este produto serão disponibilizadas em breve.
          </p>
          <Button 
            onClick={() => navigate(`/system/${systemId}`)} 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Voltar aos Produtos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {videoAulas
        .sort((a, b) => a.ordem - b.ordem)
        .map((aula) => (
          <Card 
            key={aula.id} 
            className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="p-2 bg-red-600/20 rounded-lg group-hover:bg-red-600/30 transition-colors">
                    <Play className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                      {aula.titulo}
                    </h3>
                    {aula.descricao && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {aula.descricao}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Videoaula {aula.ordem}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                  }}
                >
                  Assistir
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default VideoAulasList;
