import React from 'react';

/**
 * Fundo ambiente institucional: grid sutil + halos de luz primária.
 * Puramente decorativo, usa tokens semânticos.
 */
export const AmbientBackdrop: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}>
    <div className="absolute inset-0 bg-background" />
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 75%)',
      }}
    />
    <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
    <div className="absolute bottom-[-10rem] left-[-8rem] h-[420px] w-[420px] rounded-full bg-primary/10 blur-[130px]" />
    <div className="absolute right-[-8rem] top-1/3 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[130px]" />
  </div>
);

export default AmbientBackdrop;