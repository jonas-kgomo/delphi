import React from 'react';

type Size = 'card' | 'page';

/**
 * City as a stamp, topic beside it.
 * The precinct is the pair — not a fused name, not two copies of the place.
 */
export const PrecinctLabel: React.FC<{
  city: string;
  topic: string;
  size?: Size;
  className?: string;
}> = ({ city, topic, size = 'card', className = '' }) => {
  const page = size === 'page';
  return (
    <span className={`${page ? 'flex' : 'inline-flex'} flex-wrap items-center gap-2.5 min-w-0 ${className}`}>
      <span
        className={`shrink-0 font-sans uppercase tracking-[0.16em] rounded-full bg-ink-100 text-ink-700 group-hover:bg-ink-950 group-hover:text-white transition-[color,background-color] duration-150 ${
          page ? 'text-[11px] px-3 py-1' : 'text-[10px] px-2.5 py-0.5'
        }`}
      >
        {city}
      </span>
      <span
        className={`font-serif font-semibold text-ink-950 leading-snug min-w-0 ${
          page ? 'text-3xl sm:text-4xl tracking-tight' : 'text-[1.35rem]'
        }`}
      >
        {page ? `${topic} Precinct` : topic}
      </span>
    </span>
  );
};
