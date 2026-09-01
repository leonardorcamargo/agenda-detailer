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

export const AgendaDetailerFooter: React.FC<{ onOpenLegal?: () => void }> = ({ onOpenLegal }) => (
  <footer className="no-print shrink-0 px-4 pt-3 pb-6">
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] leading-5 text-slate-400">
      <span className="flex items-center gap-2">
        <AgendaDetailerMark decorative className="w-6 h-7 opacity-50 grayscale" />
        <span>© 2026 <span className="font-medium">Agenda Detailer</span></span>
      </span>
      {onOpenLegal && (
        <>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={onOpenLegal} className="underline-offset-2 hover:text-blue-300 hover:underline">
            Termos, Privacidade e LGPD
          </button>
        </>
      )}
    </div>
  </footer>
);
