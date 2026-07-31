import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, Play, Package, TrendingUp } from 'lucide-react';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

export const DashboardStats: React.FC = () => {
  const { data: stats, isLoading, error } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/2 rounded bg-muted/40" />
                <div className="h-8 w-2/3 rounded bg-muted/25" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-8 border-destructive/40">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Erro ao carregar estatísticas</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente recarregar a página</p>
        </CardContent>
      </Card>
    );
  }

  const secondary = [
    {
      title: 'Usuários cadastrados',
      value: stats?.totalUsuarios ?? 0,
      icon: Users,
      description: 'Admins + usuários de cartórios',
    },
    {
      title: 'Videoaulas',
      value: stats?.totalVideoaulas ?? 0,
      icon: Play,
      description: 'Conteúdos publicados',
    },
    {
      title: 'Categorias / Produtos',
      value: `${stats?.totalSistemas ?? 0} / ${stats?.totalProdutos ?? 0}`,
      icon: Package,
      description: 'Hierarquia de conteúdo',
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Card de alto impacto */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:row-span-3"
      >
        <Card interactive className="relative h-full overflow-hidden border-primary/25">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/10 to-transparent" />
          <CardContent className="relative flex h-full flex-col justify-between gap-6 p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Building className="h-6 w-6" />
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Em tempo real
              </span>
            </div>
            <div>
              <p className="text-6xl font-bold leading-none text-foreground">
                {stats?.cartoriosAtivos ?? 0}
              </p>
              <p className="mt-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Cartórios ativos
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Acessos válidos na plataforma
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards secundários */}
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
        {secondary.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * (index + 1) }}
          >
            <Card interactive className="h-full">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.title}
                  </p>
                </div>
                <p className="text-3xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};