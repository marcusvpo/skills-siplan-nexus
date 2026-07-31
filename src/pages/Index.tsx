import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { Button } from '@/components/ui/button';

const LOGO = '/lovable-uploads/a9e0b445-b849-4273-94f3-2b81c7ae337f.png';

const features = [
  {
    icon: PlayCircle,
    title: 'Videoaulas objetivas',
    body: 'Conteúdo organizado por sistema e produto, direto ao ponto da rotina do cartório.',
  },
  {
    icon: Sparkles,
    title: 'Assistente inteligente',
    body: 'Tire dúvidas durante a aula com respostas baseadas no próprio conteúdo do vídeo.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso controlado',
    body: 'Entrada por token emitido pela Siplan, com validade e permissões gerenciadas.',
  },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackdrop className="fixed" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="Siplan" className="h-7 w-auto object-contain" />
            <span className="text-sm font-medium tracking-tight">Siplan Skills</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin-login')}>
            Área administrativa
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28">
          <motion.span
            {...fade(0)}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Capacitação oficial dos sistemas Siplan
          </motion.span>

          <motion.div {...fade(0.08)} className="mt-8 flex items-center justify-center gap-4">
            <img src={LOGO} alt="Logotipo Siplan" className="h-11 w-auto object-contain md:h-14" />
            <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
              Siplan <span className="text-primary">Skills</span>
            </h1>
          </motion.div>

          <motion.p
            {...fade(0.16)}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Plataforma de treinamento para escreventes e equipes de cartório dominarem cada recurso dos
            sistemas Siplan — no seu ritmo, com apoio de inteligência artificial.
          </motion.p>

          <motion.div {...fade(0.24)} className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button variant="glow" size="lg" onClick={() => navigate('/login')} className="gap-2">
              Entrar com meu token
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/admin-login')}>
              Sou da equipe Siplan
            </Button>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-28">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl border border-border/60 bg-card/50 p-6 text-left backdrop-blur-md transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <f.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-base font-medium tracking-tight">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>Siplan Skills</span>
          <span>© {new Date().getFullYear()} Siplan. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;