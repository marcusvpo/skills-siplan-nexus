import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const LOGO = '/lovable-uploads/a9e0b445-b849-4273-94f3-2b81c7ae337f.png';

const capabilities = [
  {
    id: '01',
    title: 'Videoaulas por produto',
    body:
      'Cada sistema Siplan é destrinchado produto a produto. Sem playlist genérica: o escrevente encontra a aula da tela exata que está usando.',
  },
  {
    id: '02',
    title: 'Assistente que leu a aula',
    body:
      'A IA responde a partir da transcrição da própria videoaula. Pergunta feita no minuto 4, resposta com o contexto do minuto 4.',
  },
  {
    id: '03',
    title: 'Trilhas com certificação',
    body:
      'Sequência obrigatória, quiz validado no servidor e certificado emitido só quando o desempenho comprova o domínio.',
  },
  {
    id: '04',
    title: 'Acesso por token do cartório',
    body:
      'A SIPLAN gera, renova e revoga o acesso. Nenhum cadastro aberto, nenhum conteúdo fora do perímetro do cliente.',
  },
];

const ticker = [
  'Registro de Imóveis',
  'Notas',
  'Registro Civil',
  'Protesto',
  'RTD',
  'Gestão',
  'Selo Digital',
  'Integrações',
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background font-display text-foreground">
      {/* trilho vertical vermelho */}
      <div aria-hidden className="pointer-events-none fixed inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary via-primary/30 to-transparent" />

      <header className="relative z-10 border-b border-border/50">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Siplan" className="h-7 w-auto object-contain" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Siplan / Skills
            </span>
          </div>
          <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em]">
            <Link to="/admin-login" className="text-muted-foreground transition-colors hover:text-foreground">
              Admin
            </Link>
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 border border-primary/60 bg-primary/10 px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Entrar
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* WORDMARK */}
        <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-14 md:px-10 md:pt-20">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="h-2 w-2 bg-primary" />
            Plataforma interna de capacitação · desde 2024
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:gap-8"
          >
            <img
              src={LOGO}
              alt="Logotipo Siplan"
              className="h-16 w-auto shrink-0 object-contain md:h-[7.5rem]"
            />
            <h1 className="font-display text-[3.4rem] font-bold leading-[0.85] tracking-[-0.045em] md:text-[7.5rem]">
              <span className="block">Siplan</span>
              <span className="block text-primary">Skills<span className="text-foreground">.</span></span>
            </h1>
          </motion.div>

          <div className="mt-12 grid gap-10 border-t border-border/50 pt-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              O treinamento oficial dos sistemas Siplan, escrito para quem opera o cartório no dia a dia.
              <span className="text-foreground"> Sistema → Produto → Videoaula</span> — a mesma hierarquia do
              software, agora como caminho de aprendizado.
            </p>

            <dl className="grid grid-cols-3 gap-6 self-end font-mono">
              {[
                ['08', 'sistemas'],
                ['34', 'produtos'],
                ['149', 'videoaulas'],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-primary/50 pl-4">
                  <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-3xl font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* TICKER */}
        <section aria-hidden className="relative overflow-hidden border-y border-border/50 bg-card/40 py-3">
          <div className="flex w-max animate-[siplan-marquee_36s_linear_infinite] gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
            {[...ticker, ...ticker, ...ticker].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-10">
                {item}
                <span className="h-1 w-1 bg-primary" />
              </span>
            ))}
          </div>
        </section>

        {/* CAPACIDADES — lista indexada, não cards */}
        <section className="mx-auto max-w-[1180px] px-6 py-20 md:px-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            O que existe dentro
          </h2>

          <ul className="mt-8 border-t border-border/50">
            {capabilities.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group relative border-b border-border/50"
              >
                <div className="absolute inset-y-0 left-0 w-0 bg-primary/10 transition-all duration-500 group-hover:w-full" />
                <div className="relative grid gap-3 px-1 py-8 md:grid-cols-[4rem_1fr_1.2fr] md:items-baseline md:gap-8">
                  <span className="font-mono text-xs text-primary">{item.id}</span>
                  <h3 className="text-2xl font-medium tracking-tight transition-transform duration-500 md:group-hover:translate-x-1">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ACESSO */}
        <section className="border-t border-border/50 bg-card/30">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-20 md:grid-cols-2 md:px-10">
            <div>
              <h2 className="text-4xl font-bold leading-[0.95] tracking-[-0.03em] md:text-5xl">
                Seu cartório já tem
                <br />
                <span className="text-primary">um token.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                Usuário e token de acesso são emitidos pelo seu representante Siplan. Se ainda não tem em mãos,
                fale com ele — a liberação é imediata.
              </p>
            </div>

            <div className="flex flex-col justify-end gap-3">
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center justify-between border border-primary bg-primary px-6 py-5 text-left text-primary-foreground transition-all hover:shadow-[0_18px_50px_-16px_hsl(var(--primary))]"
              >
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.26em] opacity-80">
                    Cartório
                  </span>
                  <span className="mt-1 block text-lg font-medium">Entrar com meu token</span>
                </span>
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>

              <button
                onClick={() => navigate('/admin-login')}
                className="group flex items-center justify-between border border-border/70 px-6 py-5 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                    Equipe Siplan
                  </span>
                  <span className="mt-1 block text-lg font-medium">Área administrativa</span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="" className="h-5 w-auto object-contain opacity-80" />
            Siplan Skills
          </div>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;