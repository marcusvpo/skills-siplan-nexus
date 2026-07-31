import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, KeyRound, MonitorPlay, Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';

const features = [
  {
    icon: MonitorPlay,
    title: 'Videoaulas interativas',
    description: 'Conteúdo em vídeo de alta qualidade sobre todos os sistemas e produtos Siplan.',
  },
  {
    icon: Bot,
    title: 'Assistente de IA',
    description: 'Tire dúvidas em tempo real com a assistente contextualizada em cada videoaula.',
  },
  {
    icon: KeyRound,
    title: 'Acesso seguro por token',
    description: 'Ambiente controlado e exclusivo para os cartórios clientes da Siplan.',
  },
];

const stats = [
  { value: '+8', label: 'Sistemas' },
  { value: '+30', label: 'Produtos' },
  { value: '+150', label: 'Videoaulas' },
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

          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
            <img
              src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png"
              alt="Logo Siplan"
              className="h-20 w-auto object-contain drop-shadow-[0_10px_30px_hsl(var(--primary)/0.45)] md:h-28"
            />
            <span className="text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              Siplan <span className="text-primary">Skills</span>
            </span>
          </div>

          <h1 className="mt-8 text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Domine os sistemas
            <span className="block bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
              Siplan de ponta a ponta
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Plataforma de treinamento oficial para os cartórios clientes Siplan: trilhas organizadas por
            sistema e produto, videoaulas objetivas e uma assistente de IA sempre disponível.
          </p>

          <div className="mt-10 flex justify-center">
            <Button variant="glow" size="lg" className="group px-8" onClick={() => navigate('/login')}>
              Acessar plataforma
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* faixa de números — régua institucional */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="flex items-stretch divide-x divide-border/60 overflow-hidden rounded-none border-y-2 border-primary/40 bg-card/30 backdrop-blur-md">
              {stats.map((stat) => (
                <div key={stat.label} className="flex-1 px-4 py-6 text-left sm:px-8">
                  <p className="font-mono text-4xl font-bold leading-none text-primary md:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Como funciona — lista editorial numerada, sem cards genéricos */}
        <section className="mt-32">
          <div className="flex items-end justify-between border-b border-border/60 pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              O que você encontra aqui
            </h2>
            <span className="font-mono text-xs text-primary">03</span>
          </div>

          <div className="divide-y divide-border/50">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group grid grid-cols-[auto_1fr] items-start gap-6 py-8 md:grid-cols-[6rem_3rem_1fr] md:gap-8"
              >
                <span className="font-mono text-3xl font-bold text-border transition-colors group-hover:text-primary md:text-4xl">
                  0{index + 1}
                </span>
                <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 transition-transform group-hover:scale-110 md:flex">
                  <feature.icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* CTA em faixa diagonal assimétrica */}
        <section className="mt-28">
          <div className="relative overflow-hidden border-l-4 border-primary bg-card/40 px-8 py-12 backdrop-blur-xl md:px-12">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 h-72 w-72 rotate-45 bg-primary/10 blur-[90px]"
            />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Acesso exclusivo</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                  Seu cartório já tem <span className="text-primary">token</span>?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Fale com seu representante Siplan para receber o usuário e o token de acesso.
                </p>
              </div>
              <Button
                variant="glow"
                size="lg"
                className="group shrink-0 px-8"
                onClick={() => navigate('/login')}
              >
                Entrar com meu token
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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