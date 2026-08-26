import React, { useEffect, useMemo, useState } from 'react';
import {
  PROVINCE_CELLS,
  PROVINCE_META,
  STAGE_LABEL,
  TOPIC_LABEL,
  voicesForRegion,
  voicesForTopic,
  type MapRegion,
  type MapStage,
  type MapTopic,
  type MapVoice,
  type ProvinceCode,
} from '../lib/governmentMap';
import type { ChapterId } from '../lib/chapters';

type Leaf = 'brief' | 'instrument' | 'deliberate' | 'record';

const STAGE_DOT: Record<MapStage, string> = {
  instrument: 'bg-ink-800',
  deliberate: 'bg-ember-500',
  record: 'bg-leaf-500',
};

const TOPICS: (MapTopic | 'all')[] = ['all', 'infrastructure', 'service', 'water'];

const FOCUS: Partial<Record<MapRegion, ProvinceCode>> = {
  natal: 'KZN',
};

interface SouthAfricaMapProps {
  region?: MapRegion;
  onOpenChapter?: (id: Extract<ChapterId, 'natal'>, leaf?: Leaf) => void;
  className?: string;
}

export const SouthAfricaMap: React.FC<SouthAfricaMapProps> = ({
  region = 'za',
  onOpenChapter,
  className = '',
}) => {
  const pool = useMemo(() => voicesForRegion('za'), []);
  const [topic, setTopic] = useState<MapTopic | 'all'>('all');
  const visible = useMemo(() => voicesForTopic(pool, topic), [pool, topic]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const focus = FOCUS[region];

  useEffect(() => {
    const preferred = focus
      ? visible.find((v) => v.province === focus) || visible[0]
      : visible[0];
    setActiveId((id) => {
      if (id && visible.some((v) => v.id === id)) return id;
      return preferred?.id ?? null;
    });
  }, [visible, focus]);

  const active = visible.find((v) => v.id === activeId) || visible[0];

  const byProvince = useMemo(() => {
    const map = new Map<ProvinceCode, MapVoice[]>();
    for (const v of visible) {
      const list = map.get(v.province) || [];
      list.push(v);
      map.set(v.province, list);
    }
    return map;
  }, [visible]);

  const selectProvince = (code: ProvinceCode) => {
    const list = byProvince.get(code);
    if (!list?.length) return;
    const idx = list.findIndex((v) => v.id === activeId);
    setActiveId(list[(idx + 1) % list.length].id);
  };

  const placesHere = active ? visible.filter((v) => v.province === active.province) : [];

  return (
    <div className={`bg-white border border-ink-200 rounded-2xl overflow-hidden ${className}`}>
      <div className="flex flex-wrap gap-2 px-5 sm:px-6 py-3 border-b border-ink-100 bg-cream/70">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`px-3 py-1 text-[11px] uppercase tracking-[0.14em] rounded-full active:scale-[0.97] transition-[transform,background-color] duration-150 ${
              topic === t
                ? 'bg-ink-950 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:border-ink-800'
            }`}
          >
            {t === 'all' ? 'All topics' : TOPIC_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_16.5rem]">
        <div className="bg-cream px-3 sm:px-8 py-5 sm:py-8 flex items-center justify-center overflow-x-auto">
          <div
            className="grid gap-[3px] sm:gap-1"
            style={{ gridTemplateColumns: 'repeat(4, minmax(2.55rem, 4.75rem))' }}
            role="list"
            aria-label="South Africa province tilemap"
          >
            {PROVINCE_CELLS.map((cell, i) => {
              const live = byProvince.get(cell.code);
              const on = active?.province === cell.code;
              const inFocus = !focus || cell.code === focus;
              const muted = !live?.length || !inFocus;
              const meta = PROVINCE_META[cell.code];
              return (
                <button
                  key={`${cell.code}-${cell.col}-${cell.row}-${i}`}
                  type="button"
                  role="listitem"
                  disabled={!live?.length}
                  onClick={() => selectProvince(cell.code)}
                  style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
                  className={`aspect-square rounded-lg border text-left p-1.5 sm:p-2 active:scale-[0.97] transition-[transform,background-color,border-color,opacity] duration-150 ${
                    muted
                      ? 'bg-white/70 border-ink-100 text-ink-300'
                      : on
                        ? 'bg-ink-950 text-white border-ink-950'
                        : 'bg-white border-ink-200 text-ink-800 hover:border-ink-800'
                  } ${!inFocus && live?.length ? 'opacity-40' : ''}`}
                  aria-label={meta.name}
                >
                  {cell.label && (
                    <span className="block text-[10px] sm:text-[11px] font-semibold tracking-wide">
                      {cell.code}
                    </span>
                  )}
                  {cell.label && live && live.length > 0 && (
                    <span className="flex gap-0.5 pt-1.5">
                      {live.slice(0, 4).map((v) => (
                        <span
                          key={v.id}
                          className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-white/80' : STAGE_DOT[v.stage]}`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="border-t lg:border-t-0 lg:border-l border-ink-100 p-5 sm:p-6 flex flex-col justify-center bg-white min-h-[16rem]">
          {active ? (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400">
                {TOPIC_LABEL[active.topic]} · {PROVINCE_META[active.province].name}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {STAGE_LABEL[active.stage]} · {active.place}
              </p>
              <blockquote className="mt-3 font-serif text-lg leading-snug text-ink-950">
                “{active.quote}”
              </blockquote>
              {placesHere.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {placesHere.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveId(v.id)}
                      className={`px-2 py-0.5 text-[11px] rounded-full border active:scale-[0.97] transition-transform duration-150 ${
                        v.id === active.id
                          ? 'bg-ink-950 text-white border-ink-950'
                          : 'border-ink-200 text-ink-600 hover:border-ink-800'
                      }`}
                    >
                      {v.place}
                    </button>
                  ))}
                </div>
              )}
              {onOpenChapter && active.chapterId ? (
                <button
                  type="button"
                  onClick={() => onOpenChapter(active.chapterId!, active.stage)}
                  className="mt-5 self-start px-4 py-2 text-sm font-medium rounded-full bg-ink-950 text-white hover:bg-ink-800 active:scale-[0.97] transition-transform duration-150"
                >
                  Open this stage
                </button>
              ) : (
                <p className="mt-5 text-xs text-ink-400">Pilot file not opened for this province yet.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-500">No voices on this topic.</p>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-ink-100 bg-cream/70">
        {(['instrument', 'deliberate', 'record'] as const).map((stage) => (
          <span
            key={stage}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-500"
          >
            <span className={`w-2 h-2 rounded-full ${STAGE_DOT[stage]}`} />
            {STAGE_LABEL[stage]}
          </span>
        ))}
        <span className="text-[11px] text-ink-400 ml-auto hidden sm:inline">
          Tilemap of South Africa
        </span>
      </div>
    </div>
  );
};
