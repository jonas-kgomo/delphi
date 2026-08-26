import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  PROVINCE_META,
  PROVINCES_GEO_URL,
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

const STAGE_RING: Record<MapStage, string> = {
  instrument: 'border-ink-800',
  deliberate: 'border-ember-400',
  record: 'border-leaf-400',
};

const TOPICS: (MapTopic | 'all')[] = ['all', 'infrastructure', 'service', 'water'];

const FOCUS: Partial<Record<MapRegion, ProvinceCode>> = {
  natal: 'KZN',
  emalahleni: 'MP',
};

const CODES: ProvinceCode[] = ['LIM', 'NW', 'GP', 'MP', 'NC', 'FS', 'KZN', 'WC', 'EC'];

let provincesPromise: Promise<GeoJSON.FeatureCollection> | null = null;

function loadProvinces() {
  if (!provincesPromise) {
    provincesPromise = fetch(PROVINCES_GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error('map');
        return r.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .catch(() => {
        provincesPromise = null;
        return { type: 'FeatureCollection', features: [] };
      });
  }
  return provincesPromise;
}

function featureCode(feature: GeoJSON.Feature): ProvinceCode | null {
  const raw = (feature.id || feature.properties?.code) as string | undefined;
  return CODES.includes(raw as ProvinceCode) ? (raw as ProvinceCode) : null;
}

interface SouthAfricaMapProps {
  region?: MapRegion;
  onOpenChapter?: (id: Extract<ChapterId, 'natal' | 'emalahleni'>, leaf?: Leaf) => void;
  className?: string;
}

export const SouthAfricaMap: React.FC<SouthAfricaMapProps> = ({
  region = 'za',
  onOpenChapter,
  className = '',
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cutoutId = useId().replace(/:/g, '');
  const [size, setSize] = useState({ w: 520, h: 560 });
  const [land, setLand] = useState<GeoJSON.FeatureCollection | null>(null);
  const pool = useMemo(() => voicesForRegion('za'), []);
  const [topic, setTopic] = useState<MapTopic | 'all'>('all');
  const visible = useMemo(() => voicesForTopic(pool, topic), [pool, topic]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const focus = FOCUS[region];

  useEffect(() => {
    let cancelled = false;
    loadProvinces().then((fc) => {
      if (!cancelled) setLand(fc);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(280, el.clientWidth || 520);
      const ratio = focus ? 1.15 : 1.18;
      const h = Math.max(focus ? 340 : 420, Math.round(w * ratio));
      setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [region, focus]);

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

  const projection = useMemo(() => {
    // Bleed left/right/bottom so the cutout stays large; keep a top margin so Limpopo is not clipped.
    const xBleed = focus ? 10 : Math.round(size.w * -0.14);
    const top = focus ? 20 : 28;
    const yBottom = focus ? size.h - 10 : size.h + Math.round(size.h * 0.1);
    const fit =
      focus && land
        ? land.features.find((f) => featureCode(f) === focus) || land
        : land;
    const proj = d3.geoMercator();
    if (fit) {
      proj.fitExtent(
        [
          [xBleed, top],
          [size.w - xBleed, yBottom],
        ],
        fit
      );
    }
    return proj;
  }, [land, focus, size.w, size.h]);

  const path = useMemo(() => d3.geoPath(projection), [projection]);
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

      <div className="grid lg:grid-cols-[minmax(22rem,1.2fr)_minmax(18rem,0.95fr)]">
        <div ref={wrapRef} className="relative bg-cream min-h-[24rem] sm:min-h-[32rem] overflow-hidden">
          <svg
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="block w-full h-auto"
            aria-label="South Africa — voices by province"
          >
            <defs>
              <filter id={cutoutId} x="-8%" y="-8%" width="116%" height="116%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0B252E" floodOpacity="0.12" />
              </filter>
            </defs>
            <g filter={`url(#${cutoutId})`}>
              {land?.features.map((feature) => {
                const code = featureCode(feature);
                if (!code) return null;
                const live = byProvince.get(code);
                const on = active?.province === code;
                const inFocus = !focus || code === focus;
                const muted = !live?.length || !inFocus;
                const d = path(feature) || undefined;
                return (
                  <path
                    key={code}
                    d={d}
                    role="button"
                    tabIndex={live?.length ? 0 : -1}
                    aria-label={PROVINCE_META[code].name}
                    onClick={() => live?.length && selectProvince(code)}
                    onKeyDown={(e) => {
                      if (!live?.length) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectProvince(code);
                      }
                    }}
                    className={`transition-[fill,stroke,opacity] duration-150 ${
                      live?.length ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    fill={muted ? '#ffffff' : on ? '#0B252E' : '#ffffff'}
                    stroke={on ? '#0B252E' : '#0B252E'}
                    strokeWidth={on ? 1.4 : 0.85}
                    strokeLinejoin="round"
                    opacity={!inFocus ? 0.38 : muted ? 0.7 : 1}
                  />
                );
              })}
            </g>
          </svg>

          {land && visible.map((v) => {
            const pt = projection([v.lng, v.lat]);
            if (!pt) return null;
            const [x, y] = pt;
            if (x < -16 || y < -16 || x > size.w + 16 || y > size.h + 16) return null;
            const on = v.id === active?.id;
            const inFocus = !focus || v.province === focus;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveId(v.id)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 active:scale-[0.97] transition-[transform,opacity] duration-150 ${
                  inFocus ? '' : 'opacity-40'
                }`}
                style={{ left: x, top: y }}
                aria-label={`${v.place}: ${STAGE_LABEL[v.stage]}`}
              >
                <img
                  src={v.picture}
                  alt=""
                  className={`rounded-full object-cover border-2 shadow-sm ${
                    on
                      ? `w-9 h-9 sm:w-10 sm:h-10 ${STAGE_RING[v.stage]}`
                      : 'w-7 h-7 sm:w-8 sm:h-8 border-white'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <aside className="border-t lg:border-t-0 lg:border-l border-ink-100 px-6 sm:px-8 lg:px-10 py-7 sm:py-8 flex flex-col justify-center bg-white min-h-[16rem]">
          {active ? (
            <div key={active.id} className="hearing-swap">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400">
                {TOPIC_LABEL[active.topic]} · {PROVINCE_META[active.province].name}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {STAGE_LABEL[active.stage]} · {active.place}
              </p>
              <blockquote className="mt-4 font-serif text-xl sm:text-2xl leading-snug text-ink-950">
                “{active.quote}”
              </blockquote>
              {placesHere.length > 1 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {placesHere.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveId(v.id)}
                      className={`px-2.5 py-1 text-[11px] rounded-full border active:scale-[0.97] transition-transform duration-150 ${
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
                  className="mt-6 self-start px-4 py-2 text-sm font-medium rounded-full bg-ink-950 text-white hover:bg-ink-800 active:scale-[0.97] transition-transform duration-150"
                >
                  Open this stage
                </button>
              ) : (
                <p className="mt-6 text-xs text-ink-400">Pilot file not opened for this province yet.</p>
              )}
            </div>
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
        <span className="text-[11px] text-ink-400 ml-auto hidden sm:inline">South Africa</span>
      </div>
    </div>
  );
};
