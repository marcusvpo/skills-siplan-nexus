import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VideoAulasList from '@/components/product/VideoAulasList'; // ✅ caminho corrigido

const ProductPage = () => {
  const { id } = useParams();
  const { product, videoAulas, loading } = useSupabaseData(id);

  return (
    <Layout>
      <div className="min-h-screen page-transition bg-gradient-to-br from-[#2a2a2a] via-[#1c1c1c] to-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header do Produto */}
          {loading ? (
            <Skeleton className="h-12 w-64 rounded-lg mb-6" />
          ) : (
            <div className="mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                {product?.nome}
              </h1>
              <p className="text-gray-400 max-w-2xl">{product?.descricao}</p>
            </div>
          )}

          {/* Lista de Videoaulas */}
          <div className="grid gap-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="gradient-card p-6">
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {videoAulas?.length > 0 ? (
                  <VideoAulasList videoAulas={videoAulas} />
                ) : (
                  <div className="text-center text-gray-400 mt-12">
                    <Video className="w-10 h-10 mx-auto mb-4 text-gray-600" />
                    Nenhuma videoaula encontrada para este produto.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
