import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { EarthRotation, RotatingEarth } from './RotatingEarth';

export type VoiceBubble = {
  id?: string;
  picture: string;
  quote: string;
  name?: string;
  lng?: number;
  lat?: number;
};

interface VoiceGlobeProps {
  voices?: VoiceBubble[];
  variant?: 'dark' | 'light';
  size?: 'hero' | 'report';
  className?: string;
}

const DEFAULT_VOICES: VoiceBubble[] = [
  {
    id: 'a',
    picture: '/portraits/a.jpg?v=2',
    quote: 'Care should start where people live.',
    name: 'Amina O.',
    lng: 36.8,
    lat: -1.3,
  },
  {
    id: 'b',
    picture: '/portraits/b.jpg?v=2',
    quote: 'We agree more than the polls suggest.',
    name: 'James K.',
    lng: -0.12,
    lat: 51.5,
  },
  {
    id: 'c',
    picture: '/portraits/c.jpg?v=2',
    quote: 'Hope and caution sit in the same room.',
    name: 'Wanjiru M.',
    lng: -74.0,
    lat: 40.7,
  },
];

const FALLBACK_COORDS: [number, number][] = [
  [36.8, -1.3],
  [-0.12, 51.5],
  [-74.0, 40.7],
];

/**
 * Globe with profile pins only; quote panel on the right updates as the world turns.
 */
export const VoiceGlobe: React.FC<VoiceGlobeProps> = ({
  voices = DEFAULT_VOICES,
  variant = 'dark',
  size = 'hero',
  className = '',
}) => {
  const shown = voices.slice(0, 3);
  const earth = size === 'hero' ? 320 : 280;
  const radius = earth / 2.15;
  const pinRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const anchors = useMemo(
    () =>
      shown.map((v, i) => ({
        lng: v.lng ?? FALLBACK_COORDS[i]?.[0] ?? 0,
        lat: v.lat ?? FALLBACK_COORDS[i]?.[1] ?? 0,
      })),
    [shown]
  );

  // Reuse one projection — mutating rotate each frame avoids alloc jitter
  const projectionRef = useRef(
    d3
      .geoOrthographic()
      .scale(radius)
      .translate([earth / 2, earth / 2])
      .clipAngle(90)
  );

  // Keep projection in sync if size changes
  projectionRef.current.scale(radius).translate([earth / 2, earth / 2]);

  const nameTone = variant === 'dark' ? 'text-white/55' : 'text-ink-400';
  const quoteTone = variant === 'dark' ? 'text-white' : 'text-ink-900';
  const panelBorder = variant === 'dark' ? 'border-white/20' : 'border-ember-400/30';

  const handleFrame = useCallback(
    (rotation: EarthRotation) => {
      const projection = projectionRef.current.rotate(rotation);
      const [rx, ry] = rotation;
      const center: [number, number] = [-rx, -ry];

      let bestIdx = activeRef.current;
      let bestDist = Infinity;

      anchors.forEach((poi, i) => {
        const el = pinRefs.current[i];
        if (!el) return;

        const dist = d3.geoDistance([poi.lng, poi.lat], center);
        const front = dist <= Math.PI / 2 - 0.05;
        const projected = projection([poi.lng, poi.lat]);

        if (!front || !projected) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

        const [x, y] = projected;
        el.style.visibility = 'visible';
        el.style.opacity = '0.85';
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      anchors.forEach((_, i) => {
        const el = pinRefs.current[i];
        if (!el || el.style.visibility === 'hidden') return;
        const img = el.firstElementChild as HTMLElement | null;
        const isBest = i === bestIdx && bestDist < Infinity;
        el.style.opacity = isBest ? '1' : '0.7';
        if (img) {
          img.style.borderColor = isBest ? '#FF9D4C' : '#FFFFFF';
          img.style.transform = isBest ? 'scale(1.12)' : 'scale(1)';
        }
      });

      if (bestDist < Infinity && bestIdx !== activeRef.current) {
        activeRef.current = bestIdx;
        setActive(bestIdx);
      }
    },
    [anchors]
  );

  const voice = shown[active] || shown[0];
  const displayName = voice?.name || DEFAULT_VOICES[active]?.name || 'Participant';

  return (
    <div
      className={`relative mx-auto flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-7 ${className}`}
      aria-label="Voices around the globe"
    >
      <div className="relative shrink-0" style={{ width: earth, height: earth }}>
        <RotatingEarth
          width={earth}
          height={earth}
          theme={variant}
          interactive
          showHint={false}
          onFrame={handleFrame}
        />

        {/* Profile pins only — no floating cards on the globe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {shown.map((v, i) => (
            <div
              key={v.id || `${v.picture}-${i}`}
              ref={(node) => {
                pinRefs.current[i] = node;
              }}
              className="absolute left-0 top-0 z-10 opacity-0"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={v.picture}
                alt=""
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-200"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fixed quote panel — text changes with the foremost pin */}
      <div
        className={`flex-1 min-w-0 max-w-[16rem] sm:max-w-[15rem] flex flex-col justify-center border-l-2 pl-4 sm:pl-5 ${panelBorder}`}
      >
        {voice && (
          <figure key={voice.id || active} className="animate-insight-pop">
            <img
              src={voice.picture}
              alt=""
              className="w-10 h-10 rounded-md object-cover border border-ember-400/50 mb-3"
            />
            <blockquote className={`font-serif text-base sm:text-lg leading-snug ${quoteTone}`}>
              “{voice.quote}”
            </blockquote>
            <figcaption className={`mt-3 text-[11px] tracking-wide ${nameTone}`}>
              {displayName}
            </figcaption>
          </figure>
        )}

        <div className="flex gap-1.5 mt-5" aria-hidden>
          {shown.map((v, i) => (
            <span
              key={v.id || i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active ? 'w-5 bg-ember-400' : 'w-1.5 bg-ember-400/35'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
