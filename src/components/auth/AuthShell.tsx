import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  topRight?: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  eyebrow,
  title,
  subtitle,
  children,
  topRight,
  footer,
}) => (
  <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
    <AmbientBackdrop />

    {topRight && <div className="fixed right-4 top-4 z-20">{topRight}</div>}

    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-md"
    >
      {/* halo do card */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/40 via-border/40 to-transparent" />
      <div className="relative rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur-xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png"
              alt="Siplan Skills"
              className="h-14 w-auto object-contain"
            />
          </div>
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {eyebrow}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {children}

        <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
          {footer}
          <Link
            to="/"
            className="group flex items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </motion.div>
  </div>
);

export default AuthShell;