import React, { useEffect, useRef, useState } from 'react';
import { EdgeGlowStyle, EdgeGlowMode } from '@myujiku/shared';
import { AudioEngine } from '../../audio/AudioEngine';

interface EdgeGlowOverlayProps {
  style: EdgeGlowStyle;
  mode: EdgeGlowMode;
  accentColor?: string; // e.g. CSS var or OKLCH color
}

export const EdgeGlowOverlay: React.FC<EdgeGlowOverlayProps> = ({
  style,
  mode,
  accentColor = 'var(--color-accent, #38bdf8)',
}) => {
  const [intensity, setIntensity] = useState<number>(0.5);
  const animRef = useRef<number | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(64) as unknown as Uint8Array<ArrayBuffer>);

  useEffect(() => {
    if (style === 'off') {
      return;
    }

    const engine = AudioEngine.getInstance();
    let phase = 0;

    const tick = () => {
      if (mode === 'static') {
        setIntensity(0.7);
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      if (mode === 'ambient') {
        phase += 0.03;
        // Slow gentle sinusoidal breath: 0.35 to 0.75
        const val = 0.55 + Math.sin(phase) * 0.2;
        setIntensity(val);
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      // 'reactive' or 'music_sync'
      engine.getByteFrequencyData(freqDataRef.current as unknown as Uint8Array);
      // Sample lower/sub-bass frequencies (bins 1 to 8) for beat detection
      let sum = 0;
      const count = 8;
      for (let i = 1; i <= count; i++) {
        sum += freqDataRef.current[i] || 0;
      }
      const avg = sum / (count * 255); // 0.0 to 1.0
      // Scale and smooth
      const target = Math.max(0.2, Math.min(1.0, avg * 1.5));
      setIntensity((prev) => prev * 0.75 + target * 0.25);

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [style, mode]);

  if (style === 'off') return null;

  const glowAlpha = (intensity * 0.8).toFixed(2);
  const spreadPx = Math.round(20 + intensity * 60);

  // Render each style
  switch (style) {
    case 'ring':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-all duration-75"
          style={{
            boxShadow: `inset 0 0 ${spreadPx}px ${Math.round(spreadPx / 2)}px ${accentColor}`,
            opacity: glowAlpha,
          }}
        />
      );

    case 'corners':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: glowAlpha }}
        >
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      );

    case 'bars':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex justify-between"
          style={{ opacity: glowAlpha }}
        >
          <div
            className="w-16 h-full blur-2xl"
            style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
          />
          <div
            className="w-16 h-full blur-2xl"
            style={{ background: `linear-gradient(to left, ${accentColor}, transparent)` }}
          />
        </div>
      );

    case 'vignette':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(circle at center, transparent 40%, ${accentColor} 100%)`,
            opacity: Number(glowAlpha) * 0.45,
            mixBlendMode: 'screen',
          }}
        />
      );

    case 'spotlight':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor} 0%, transparent 75%)`,
            opacity: glowAlpha,
            mixBlendMode: 'screen',
          }}
        />
      );

    case 'aurora':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: glowAlpha }}
        >
          <div
            className="absolute inset-x-0 -bottom-20 h-72 blur-3xl animate-pulse"
            style={{
              background: `linear-gradient(90deg, transparent, ${accentColor}, #ec4899, transparent)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
      );

    case 'neon_tube':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 z-10 rounded-2xl border-2 transition-all duration-75"
          style={{
            borderColor: accentColor,
            boxShadow: `0 0 ${spreadPx}px ${accentColor}, inset 0 0 ${Math.round(spreadPx / 2)}px ${accentColor}`,
            opacity: glowAlpha,
          }}
        />
      );

    case 'conic':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: Number(glowAlpha) * 0.6 }}
        >
          <div
            className="absolute -inset-[50%] animate-[spin_10s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg, ${accentColor}, transparent 30%, ${accentColor} 60%, transparent 80%, ${accentColor})`,
              filter: 'blur(60px)',
            }}
          />
        </div>
      );

    case 'ripple':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        >
          <div
            className="rounded-full border border-white/20 transition-transform duration-100"
            style={{
              width: `${50 + intensity * 60}%`,
              height: `${50 + intensity * 60}%`,
              boxShadow: `0 0 ${spreadPx}px ${accentColor}`,
              opacity: glowAlpha,
            }}
          />
        </div>
      );

    case 'breathing':
      return (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 ${spreadPx * 1.5}px ${accentColor}`,
            opacity: glowAlpha,
          }}
        />
      );

    default:
      return null;
  }
};

