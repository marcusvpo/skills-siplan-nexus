import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Package, PlayCircle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgress } from '@/components/user/CircularProgress';
import { useSistemasCartorioWithAccess } from '@/hooks/useSistemasCartorioWithAccess';
import { useProgressoGeral } from '@/hooks/useProgressoGeral';

export const LearnerStats: React.FC = () => {
  const { data: sistemas = [], isLoading } = useSistemasCartorioWithAccess();
  const { progressos } = useProgressoGeral();

  const totalSistemas = sistemas.length;
  const totalProdutos = sistemas.reduce((acc, s) => acc + (s.produtos?.length || 0), 0);
  const totalAulas = sistemas.reduce(
    (acc, s) => acc + (s.produtos?.reduce((a, p) => a + (p.video_aulas?.length || 0), 0) || 0),
    0
  );
  const concluidas = Object.values(progressos).reduce((acc, p) => acc + p.completas, 0);
  const percentual = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

  if (isLoading) return null;

  const cards = [
    { icon: Layers, label: 'Sistemas', value: totalSistemas },
    { icon: Package, label: 'Produtos', value: totalProdutos },
    { icon: PlayCircle, label: 'Videoaulas', value: totalAulas },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
        >
          <Card interactive className="h-full">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
      >
        <Card interactive className="h-full border-primary/25">
          <CardContent className="flex items-center gap-4 p-5">
            <CircularProgress value={percentual} />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Trophy className="h-4 w-4 text-primary" />
                {concluidas} concluídas
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso geral</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
