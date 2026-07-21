import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

type Theme = 'dark' | 'light';

export type EarthRotation = [number, number, number];

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
  theme?: Theme;
  showHint?: boolean;
  interactive?: boolean;
  /** Fired every frame / drag so overlays can stay anchored */
  onFrame?: (rotation: EarthRotation) => void;
}

type DotData = { lng: number; lat: number };

/** Orange + white only — no dark fills */
const THEMES: Record<
  Theme,
  { ocean: string; stroke: string; graticule: string; dots: string; hint: string }
> = {
  dark: {
    ocean: '#FFFFFF',
    stroke: 'rgba(255,157,76,0.85)',
    graticule: 'rgba(255,157,76,0.28)',
    dots: '#FF9D4C',
    hint: 'text-white/70',
  },
  light: {
    ocean: '#FFFFFF',
    stroke: 'rgba(255,157,76,0.9)',
    graticule: 'rgba(255,157,76,0.22)',
    dots: '#FF9D4C',
    hint: 'text-ember-500',
  },
};

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInFeature(point: [number, number], feature: GeoJSON.Feature): boolean {
  const geometry = feature.geometry;
  if (!geometry) return false;

  if (geometry.type === 'Polygon') {
    const coordinates = geometry.coordinates;
    if (!pointInPolygon(point, coordinates[0] as number[][])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygon(point, coordinates[i] as number[][])) return false;
    }
    return true;
  }

  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      if (pointInPolygon(point, polygon[0] as number[][])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (pointInPolygon(point, polygon[i] as number[][])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
  }

  return false;
}

function generateDotsInPolygon(feature: GeoJSON.Feature, dotSpacing = 18): [number, number][] {
  const dots: [number, number][] = [];
  const bounds = d3.geoBounds(feature);
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const stepSize = dotSpacing * 0.08;

  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const point: [number, number] = [lng, lat];
      if (pointInFeature(point, feature)) dots.push(point);
    }
  }
  return dots;
}

export const RotatingEarth: React.FC<RotatingEarthProps> = ({
  width = 420,
  height = 420,
  className = '',
  theme = 'dark',
  showHint = false,
  interactive = true,
  onFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const [error, setError] = useState<string | null>(null);
  const palette = THEMES[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const containerWidth = width;
    const containerHeight = height;
    const radius = Math.min(containerWidth, containerHeight) / 2.15;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    const allDots: DotData[] = [];
    let landFeatures: GeoJSON.FeatureCollection | null = null;
    const rotation: EarthRotation = [20, -15, 0];
    let dragging = false;
    const degreesPerSecond = 12;
    let rafId = 0;
    let lastTs = 0;
    let cancelled = false;

    const emitFrame = () => {
      onFrameRef.current?.([rotation[0], rotation[1], rotation[2]]);
    };

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight);
      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      context.beginPath();
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
      context.fillStyle = palette.ocean;
      context.fill();
      context.strokeStyle = palette.stroke;
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      if (!landFeatures) {
        emitFrame();
        return;
      }

      const graticule = d3.geoGraticule();
      context.beginPath();
      path(graticule());
      context.strokeStyle = palette.graticule;
      context.lineWidth = 0.8 * scaleFactor;
      context.stroke();

      context.beginPath();
      landFeatures.features.forEach((feature) => {
        path(feature);
      });
      context.strokeStyle = palette.stroke;
      context.lineWidth = 0.9 * scaleFactor;
      context.stroke();

      allDots.forEach((dot) => {
        const projected = projection([dot.lng, dot.lat]);
        if (!projected) return;
        const [x, y] = projected;
        if (x < 0 || x > containerWidth || y < 0 || y > containerHeight) return;
        const [rx, ry] = projection.rotate();
        if (d3.geoDistance([dot.lng, dot.lat], [-rx, -ry]) > Math.PI / 2) return;
        context.beginPath();
        context.arc(x, y, 1.15 * scaleFactor, 0, 2 * Math.PI);
        context.fillStyle = palette.dots;
        context.fill();
      });

      emitFrame();
    };

    const tick = (ts: number) => {
      if (cancelled) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(48, ts - lastTs) / 1000;
      lastTs = ts;

      if (!dragging && landFeatures) {
        rotation[0] += degreesPerSecond * dt;
        projection.rotate(rotation);
        render();
      }

      rafId = requestAnimationFrame(tick);
    };

    const loadWorldData = async () => {
      try {
        const response = await fetch('/geo/ne_110m_land.json');
        if (!response.ok) throw new Error('Failed to load land data');
        if (cancelled) return;
        landFeatures = (await response.json()) as GeoJSON.FeatureCollection;
        if (cancelled) return;
        landFeatures.features.forEach((feature) => {
          generateDotsInPolygon(feature, 18).forEach(([lng, lat]) => {
            allDots.push({ lng, lat });
          });
        });
        projection.rotate(rotation);
        render();
        lastTs = 0;
        rafId = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setError('Could not load map');
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!interactive) return;
      dragging = true;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation: EarthRotation = [...rotation];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.45;
        rotation[0] = startRotation[0] + (moveEvent.clientX - startX) * sensitivity;
        rotation[1] = Math.max(
          -90,
          Math.min(90, startRotation[1] - (moveEvent.clientY - startY) * sensitivity)
        );
        projection.rotate(rotation);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        dragging = false;
        lastTs = 0;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    void loadWorldData();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [width, height, theme, interactive, palette.ocean, palette.stroke, palette.graticule, palette.dots]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white text-xs text-ember-500 ${className}`}
        style={{ width, height }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="block rounded-full cursor-grab active:cursor-grabbing"
        aria-label="Rotating globe"
      />
      {showHint && (
        <p className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] ${palette.hint}`}>
          Drag to turn
        </p>
      )}
    </div>
  );
};
