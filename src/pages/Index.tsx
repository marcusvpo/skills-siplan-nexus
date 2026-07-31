import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const LOGO = '/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png';

const capitulos = [
  {
    n: '01',
    titulo: 'Escolha o sistema',
    texto: 'Orion REG, Orion TN, Orion PRO, Siplan RC e LCW. Cada sistema com seus produtos catalogados.',
  },
  {
    n: '02',
    titulo: 'Assista a aula certa',
    texto: 'Videoaulas curtas, gravadas pela equipe Siplan, direto ao ponto da rotina do balcão.',
  },
  {
    n: '03',
    titulo: 'Pergunte durante a aula',
    texto: 'A assistente lê a transcrição da videoaula aberta e responde no contexto exato dela.',
  },
  {
    n: '04',
    titulo: 'Acompanhe o progresso',
    texto: 'O cartório vê o que já foi concluído e o que falta para cada escrevente.',
  },
];

const numeros = [
  { valor: '8', label: 'sistemas' },
  { valor: '34', label: 'produtos' },
  { valor: '149', label: 'videoaulas' },
  { valor: '296', label: 'escreventes' },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* barra superior */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Siplan · treinamento oficial
          </span>
          <Link
            to="/admin-login"
            className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Administração
          </Link>
        </div>
      </div>

      {/* wordmark */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-[1180px] px-6 py-14 md:py-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
            <img
              src={LOGO}
              alt="Siplan"
              className="h-16 w-auto shrink-0 object-contain md:h-24"
            />
            <h1 className="text-[15vw] font-black leading-[0.82] tracking-[-0.05em] md:text-[7.5rem]">
              Siplan<span className="text-primary">.</span>
              <br className="md:hidden" />
              <span className="md:ml-4">Skills</span>
            </h1>
          </div>

          <div className="mt-10 grid gap-10 border-t border-border/60 pt-8 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
            <p className="max-w-xl text-lg leading-snug text-foreground/85 md:text-2xl">
              A escola dos sistemas Siplan. Feita para escrevente aprender de verdade —
              sem manual de 200 páginas, sem esperar visita técnica.
            </p>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center md:justify-end">
              <button
                onClick={() => navigate('/login')}
                className="group inline-flex items-center gap-3 whitespace-nowrap bg-primary px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Entrar com meu token
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                acesso exclusivo
                <br />
                de cartórios clientes
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* faixa de números */}
      <section className="border-b border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-border/60 px-6 md:grid-cols-4 md:divide-x">
          {numeros.map((item, i) => (
            <div
              key={item.label}
              className={`py-7 ${i % 2 === 1 ? 'border-l border-border/60 pl-6 md:border-l-0 md:pl-0' : ''} ${
                i < 2 ? 'border-b border-border/60 md:border-b-0' : ''
              } md:px-8 md:first:pl-0`}
            >
              <p className="font-mono text-4xl font-bold tabular-nums text-foreground">{item.valor}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* como funciona — lista editorial */}
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-24">
        <div className="mb-10 flex items-baseline justify-between border-b border-border/60 pb-4">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Como o treinamento funciona</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            04 etapas
          </span>
        </div>

        <ol className="divide-y divide-border/60">
          {capitulos.map((c) => (
            <li
              key={c.n}
              className="group grid gap-2 py-7 transition-colors hover:bg-card/50 md:grid-cols-[5rem_16rem_1fr] md:items-baseline md:gap-8 md:px-3"
            >
              <span className="font-mono text-sm text-primary md:text-base">{c.n}</span>
              <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{c.titulo}</h3>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {c.texto}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* citação / posicionamento */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
          <blockquote className="max-w-4xl text-2xl font-medium leading-snug tracking-tight md:text-4xl">
            <span className="text-primary">“</span>
            Sistema bom é sistema que a equipe sabe usar.
            <span className="text-muted-foreground">
              {' '}
              O Skills existe para que nenhum recurso da Siplan fique parado por falta de treino.
            </span>
            <span className="text-primary">”</span>
          </blockquote>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Equipe de implantação · Siplan
          </p>
        </div>
      </section>

      {/* acesso */}
      <section className="mx-auto max-w-[1180px] px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:gap-20">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Já tem seu token<span className="text-primary">?</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              O usuário e o token de acesso são entregues pelo representante Siplan responsável pelo seu
              cartório. Um acesso por cartório, válido até a data de expiração combinada.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-3 border-t border-border/60 pt-8 md:border-l md:border-t-0 md:pl-16 md:pt-0">
            <button
              onClick={() => navigate('/login')}
              className="group flex w-full items-center justify-between border border-border/60 px-6 py-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="text-base font-semibold">Sou do cartório</span>
              <ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('/admin-login')}
              className="group flex w-full items-center justify-between border border-border/60 px-6 py-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="text-base font-semibold text-muted-foreground group-hover:text-foreground">
                Sou da equipe Siplan
              </span>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Siplan Skills</span>
          <span>skills.siplan.com.br</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;