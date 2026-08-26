import React, { useEffect, useState } from 'react';
import { PRECINCT_HEARING } from '../lib/brand';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/**
 * Bento slideshow: one featured hearing statement, three waiting tiles.
 * Auto-advances; pause on hover / focus / off-screen.
 */
export const HearingBento: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [featured, setFeatured] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!root) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.7] },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [root]);

  const hold = paused || !inView;

  const advance = () => {
    if (hold || reduced) return;
    setFeatured((i) => (i + 1) % PRECINCT_HEARING.length);
  };
  const rest = PRECINCT_HEARING.map((item, i) => ({ item, i })).filter(({ i }) => i !== featured);
  const current = PRECINCT_HEARING[featured];

  return (
    <div
      ref={setRoot}
      className="grid lg:grid-cols-12 gap-3 lg:min-h-[22rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <article className="relative overflow-hidden lg:col-span-7 bg-ink-950 text-white rounded-2xl px-6 sm:px-8 py-8 sm:py-10 flex flex-col justify-between min-h-[16rem]">
        <div key={featured} className="hearing-swap space-y-4" aria-live="polite">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            {String(featured + 1).padStart(2, '0')} / {String(PRECINCT_HEARING.length).padStart(2, '0')}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.15rem] font-semibold leading-[1.15] tracking-tight">
            {current.title}
          </h2>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-md">{current.body}</p>
        </div>

        <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Hearing statements">
          {PRECINCT_HEARING.map((item, i) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={i === featured}
              aria-label={item.title}
              onClick={() => setFeatured(i)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out ${
                i === featured ? 'w-8 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {!reduced && (
          <span
            key={featured}
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 bg-ember-400 hearing-progress ${
              hold ? 'is-paused' : ''
            }`}
            aria-hidden
            onAnimationEnd={advance}
          />
        )}
      </article>

      <div className="lg:col-span-5 grid gap-3">
        {rest.map(({ item, i }, slot) => (
          <button
            key={`${slot}-${item.title}`}
            type="button"
            onClick={() => setFeatured(i)}
            className="hearing-swap text-left bg-white border border-ink-200 rounded-2xl px-5 py-5 hover:border-ink-800 hover:bg-ink-50 active:scale-[0.99] transition-[transform,background-color,border-color] duration-150"
          >
            <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-400 mb-1.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="block font-serif text-lg sm:text-xl font-semibold text-ink-950 leading-snug">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
