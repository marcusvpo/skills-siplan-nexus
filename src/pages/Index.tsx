import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, GraduationCap, ShieldCheck, Sparkle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';

const features = [
  {
    icon: Video,
    title: 'Videoaulas interativas',
    description: 'Conteúdo em vídeo de alta qualidade sobre todos os sistemas e produtos Siplan.',
  },
  {
    icon: Bot,
    title: 'Assistente de IA',
    description: 'Tire dúvidas em tempo real com a assistente contextualizada em cada videoaula.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso seguro por token',
    description: 'Ambiente controlado e exclusivo para os cartórios clientes da Siplan.',
  },
];

const stats = [
  { value: '8', label: 'Sistemas' },
  { value: '34', label: 'Produtos' },
  { value: '149', label: 'Videoaulas' },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientBackdrop />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <img
          src="/lovable-uploads/938cc4b0-f47e-4bb5-9eb9-1848eaade9af.png"
          alt="Siplan Skills"
          className="h-9 w-auto object-contain"
        />
        <Link
          to="/admin-login"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Área administrativa
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pt-16 text-center md:pt-24"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkle className="h-3.5 w-3.5" />
            Capacitação para cartórios
          </span>

          <h1 className="mt-8 text-5xl font-bold leading-[0.95] tracking-tight text-foreground md:text-7xl">
            Domine os sistemas
            <span className="block bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
              Siplan de ponta a ponta
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Plataforma de treinamento oficial para os cartórios clientes Siplan: trilhas organizadas por
            sistema e produto, videoaulas objetivas e uma assistente de IA sempre disponível.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="glow" size="lg" className="group px-8" onClick={() => navigate('/login')}>
              Acessar plataforma
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="px-8" onClick={() => navigate('/admin-login')}>
              Sou administrador
            </Button>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-card/50 px-4 py-5 backdrop-blur-md"
              >
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="mt-28 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card interactive className="h-full border-border/60 bg-card/60">
                <CardContent className="p-7">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-28">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 px-8 py-14 text-center backdrop-blur-xl">
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]"
            />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Pronto para começar?</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Fale com seu representante Siplan para receber o usuário e o token de acesso do seu cartório.
              </p>
              <Button variant="glow" size="lg" className="mt-8 px-8" onClick={() => navigate('/login')}>
                Entrar com meu token
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Siplan Skills — Plataforma de treinamento Siplan.
      </footer>
    </div>
  );
};

export default Index;