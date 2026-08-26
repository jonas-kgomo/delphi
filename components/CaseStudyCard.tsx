import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Chapter } from '../lib/chapters';
import { PrecinctLabel } from './PrecinctLabel';

/** One case: city stamp + topic, a line of theme, folio at the foot. */
export const CaseStudyCard: React.FC<{
  chapter: Chapter;
  onOpen: () => void;
  className?: string;
}> = ({ chapter, onOpen, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full text-left bg-white border border-ink-200 rounded-2xl px-5 py-5 hover:border-ink-800 hover:bg-ink-50 active:scale-[0.99] transition-[transform,background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800 focus-visible:ring-offset-2 ${className}`}
    >
      <span className="flex items-start justify-between gap-3">
        <PrecinctLabel city={chapter.city} topic={chapter.topic} />
        <ArrowUpRight
          size={16}
          className="mt-1 shrink-0 text-ink-400 group-hover:text-ink-950 transition-colors duration-150"
        />
      </span>
      <span className="mt-3 block text-sm text-ink-800/70 leading-relaxed max-w-md">
        {chapter.theme}
      </span>
      <span className="mt-4 flex items-baseline gap-2 text-[11px] text-ink-400">
        {chapter.country !== chapter.city ? (
          <>
            <span>{chapter.country}</span>
            <span aria-hidden>·</span>
          </>
        ) : null}
        <span className="tabular-nums tracking-[0.08em]">{chapter.fileNo}</span>
      </span>
    </button>
  );
};
