import React from 'react';

// Cropped directly from the approved brand artwork; do not substitute a redraw.
export const AgendaDetailerMark: React.FC<{ className?: string; decorative?: boolean }> = ({
  className = '',
  decorative = false,
}) => (
  <img
    src="/agenda-detailer-mark.webp"
    alt={decorative ? '' : 'Agenda Detailer'}
    width={32}
    height={34}
    draggable={false}
    className={`object-contain mix-blend-screen shrink-0 ${className}`}
  />
);

export const AgendaDetailerFooter: React.FC = () => (
  <footer className="no-print shrink-0 px-4 pt-3 pb-6">
    <div className="flex items-center justify-center gap-2 text-[11px] leading-5 text-slate-400">
      <AgendaDetailerMark decorative className="w-6 h-7 opacity-50 grayscale" />
      <p>Desenvolvido por <span className="font-medium">Agenda Detailer</span></p>
    </div>
  </footer>
);
