import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { EarthRotation, RotatingEarth, earthDiscScale } from './RotatingEarth';

export type VoiceBubble = {
  id?: string;
  picture: string;
  quote: string;
  name?: string;
  /** City / region label under the name */
  place?: string;
  lng?: number;
  lat?: number;
};

interface VoiceGlobeProps {
  voices?: VoiceBubble[];
  variant?: 'dark' | 'light';
  size?: 'hero' | 'report';
  className?: string;
  /** Cap pins on the globe */
  maxPins?: number;
  /** Orthographic zoom — higher = Africa fills more of the disc */
  zoom?: number;
}

/** Local + Unsplash faces — one unique portrait per demo voice */
const PORTRAITS = {
  a: '/portraits/a.jpg?v=3',
  b: '/portraits/b.jpg?v=3',
  c: '/portraits/c.jpg?v=3',
  d: '/portraits/d.jpg?v=3',
  e: 'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  f: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  g: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  h: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  i: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  j: 'https://images.unsplash.com/photo-1554727242-741c14fa561c?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  k: 'https://images.unsplash.com/photo-1777380349634-9ec8944cd48c?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
  l: 'https://images.unsplash.com/photo-1782485026385-c6bc0c5e795c?auto=format&fit=crop&w=160&h=160&q=80&crop=faces',
} as const;

/** Africa-centred archive — unique face + city per pin */
const DEFAULT_VOICES: VoiceBubble[] = [
  {
    id: 'nairobi',
    picture: PORTRAITS.a,
    quote: 'Care should start where people live — not only in the CBD.',
    name: 'Amina O.',
    place: 'Nairobi',
    lng: 36.82,
    lat: -1.29,
  },
  {
    id: 'lagos',
    picture: PORTRAITS.d,
    quote: 'I agree — but only if the clinic stays open after 6.',
    name: 'Chioma A.',
    place: 'Lagos',
    lng: 3.38,
    lat: 6.45,
  },
  {
    id: 'accra',
    picture: PORTRAITS.f,
    quote: 'Trust the frontline workers before the glossy campaigns.',
    name: 'Kwame B.',
    place: 'Accra',
    lng: -0.19,
    lat: 5.56,
  },
  {
    id: 'kampala',
    picture: PORTRAITS.c,
    quote: 'Hope and caution sit in the same room here.',
    name: 'Wanjiru M.',
    place: 'Kampala',
    lng: 32.58,
    lat: 0.35,
  },
  {
    id: 'cape-town',
    picture: PORTRAITS.e,
    quote: 'Cost is the barrier people name first — then transport.',
    name: 'Thandi N.',
    place: 'Cape Town',
    lng: 18.42,
    lat: -33.93,
  },
  {
    id: 'addis',
    picture: PORTRAITS.k,
    quote: 'We agree more than the polls suggest.',
    name: 'Hanna T.',
    place: 'Addis Ababa',
    lng: 38.75,
    lat: 9.03,
  },
  {
    id: 'dakar',
    picture: PORTRAITS.i,
    quote: 'Digital booking helps — if the network holds.',
    name: 'Fatou S.',
    place: 'Dakar',
    lng: -17.47,
    lat: 14.72,
  },
  {
    id: 'kigali',
    picture: PORTRAITS.g,
    quote: 'Local first does not mean alone — we still need the region.',
    name: 'Jean-Claude U.',
    place: 'Kigali',
    lng: 30.06,
    lat: -1.94,
  },
  {
    id: 'dar',
    picture: PORTRAITS.j,
    quote: 'Listen longer before you count the votes.',
    name: 'Neema J.',
    place: 'Dar es Salaam',
    lng: 39.21,
    lat: -6.79,
  },
  {
    id: 'johannesburg',
    picture: PORTRAITS.h,
    quote: 'Wait times are only “acceptable” if you have nowhere else to be.',
    name: 'Sipho M.',
    place: 'Johannesburg',
    lng: 28.05,
    lat: -26.2,
  },
  {
    id: 'abidjan',
    picture: PORTRAITS.b,
    quote: 'What a form leaves unsaid should sound like the street, not the boardroom.',
    name: 'Aïcha K.',
    place: 'Abidjan',
    lng: -4.03,
    lat: 5.36,
  },
  {
    id: 'cairo',
    picture: PORTRAITS.l,
    quote: 'Bridge statements matter more than winning the argument.',
    name: 'Yasmin H.',
    place: 'Cairo',
    lng: 31.24,
    lat: 30.04,
  },
];

const FALLBACK_COORDS: [number, number][] = DEFAULT_VOICES.map((v) => [
  v.lng ?? 20,
  v.lat ?? 0,
]);

const AFRICA_ROTATION: EarthRotation = [-20, -5, 0];

/**
 * Zoomed globe with unique profile pins; quote panel follows the foremost POI.
 */
export const VoiceGlobe: React.FC<VoiceGlobeProps> = ({
  voices = DEFAULT_VOICES,
  variant = 'dark',
  size = 'hero',
  className = '',
  maxPins = 12,
  zoom = 1,
}) => {
  const shown = voices.slice(0, Math.max(1, maxPins));
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const earth = size === 'hero' ? (wide ? 320 : 248) : wide ? 280 : 220;
  const { discR, scale } = earthDiscScale(earth, zoom);
  const pinSize = shown.length > 7 ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9';
  const pinRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  const anchors = useMemo(
    () =>
      shown.map((v, i) => ({
        lng: v.lng ?? FALLBACK_COORDS[i]?.[0] ?? 20,
        lat: v.lat ?? FALLBACK_COORDS[i]?.[1] ?? 0,
      })),
    [shown]
  );

  const projectionRef = useRef(
    d3
      .geoOrthographic()
      .scale(scale)
      .translate([earth / 2, earth / 2])
      .clipAngle(90)
  );

  // Keep pin projection locked to the same scale as the canvas globe
  projectionRef.current.scale(scale).translate([earth / 2, earth / 2]);

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
        const front = dist <= Math.PI / 2 - 0.08;
        const projected = projection([poi.lng, poi.lat]);

        if (!front || !projected) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

        const [x, y] = projected;
        // Hide pins that land outside the visible disc when zoomed
        const dx = x - earth / 2;
        const dy = y - earth / 2;
        if (dx * dx + dy * dy > (discR - 8) * (discR - 8)) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

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
        el.style.opacity = isBest ? '1' : '0.72';
        el.style.zIndex = isBest ? '20' : '10';
        if (img) {
          img.style.borderColor = isBest ? '#FF9D4C' : '#FFFFFF';
          img.style.transform = isBest ? 'scale(1.14)' : 'scale(1)';
        }
      });

      if (bestDist < Infinity && bestIdx !== activeRef.current) {
        activeRef.current = bestIdx;
        setActive(bestIdx);
      }
    },
    [anchors, earth, discR]
  );

  const voice = shown[active] || shown[0];
  const displayName = voice?.name || DEFAULT_VOICES[active]?.name || 'Participant';
  const displayPlace = voice?.place;

  return (
    <div
      className={`relative mx-auto flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-7 ${className}`}
      aria-label="Voices around the globe"
    >
      <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: earth, height: earth }}>
        <RotatingEarth
          width={earth}
          height={earth}
          theme={variant}
          interactive
          showHint={false}
          zoom={zoom}
          spinSpeed={8}
          initialRotation={AFRICA_ROTATION}
          onFrame={handleFrame}
        />

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
                referrerPolicy="no-referrer"
                className={`${pinSize} rounded-full object-cover border-2 border-white shadow-sm transition-transform duration-200`}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={`flex-1 min-w-0 max-w-[16rem] sm:max-w-[15rem] flex flex-col justify-center border-l-2 pl-4 sm:pl-5 ${panelBorder}`}
      >
        {voice && (
          <figure key={voice.id || active} className="animate-insight-pop">
            <img
              src={voice.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-md object-cover border border-ember-400/50 mb-3"
            />
            <blockquote className={`font-serif text-base sm:text-lg leading-snug ${quoteTone}`}>
              “{voice.quote}”
            </blockquote>
            <figcaption className={`mt-3 text-[11px] tracking-wide ${nameTone}`}>
              {displayName}
              {displayPlace ? ` · ${displayPlace}` : ''}
            </figcaption>
          </figure>
        )}

        <div className="flex flex-wrap gap-1.5 mt-5" aria-hidden>
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
