import React, { useEffect, useRef } from 'react';

export type ParticleOverlayEffect =
  | 'none'
  | 'rain'
  | 'snow'
  | 'dust'
  | 'embers'
  | 'stars'
  | 'scanlines'
  | 'grain'
  | 'bokeh';

interface ParticleOverlayProps {
  effect: ParticleOverlayEffect;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color?: string;
  twinkle?: number;
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ effect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none' || effect === 'scanlines' || effect === 'grain') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const count = effect === 'rain' ? 80 : effect === 'snow' ? 60 : effect === 'embers' ? 50 : effect === 'stars' ? 70 : 35;
    const particles: Particle[] = [];

    const resetParticle = (p: Particle, width: number, height: number, initial = false) => {
      p.x = Math.random() * width;
      p.y = initial ? Math.random() * height : effect === 'embers' ? height + 10 : -10;

      switch (effect) {
        case 'rain':
          p.vx = -1.5;
          p.vy = 12 + Math.random() * 8;
          p.size = 1.5;
          p.alpha = 0.3 + Math.random() * 0.4;
          break;
        case 'snow':
          p.vx = (Math.random() - 0.5) * 1;
          p.vy = 1 + Math.random() * 2;
          p.size = 2 + Math.random() * 3;
          p.alpha = 0.4 + Math.random() * 0.5;
          break;
        case 'embers':
          p.vx = (Math.random() - 0.5) * 1.5;
          p.vy = -(1.5 + Math.random() * 3);
          p.size = 1.5 + Math.random() * 3;
          p.alpha = 0.6 + Math.random() * 0.4;
          p.color = Math.random() > 0.5 ? '#f97316' : '#ef4444';
          break;
        case 'stars':
          p.vx = 0;
          p.vy = 0;
          p.y = Math.random() * height;
          p.size = 1 + Math.random() * 2;
          p.alpha = Math.random();
          p.twinkle = 0.02 + Math.random() * 0.04;
          break;
        case 'dust':
        case 'bokeh':
        default:
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = (Math.random() - 0.5) * 0.4;
          p.size = effect === 'bokeh' ? 15 + Math.random() * 35 : 1.5 + Math.random() * 2;
          p.alpha = effect === 'bokeh' ? 0.08 + Math.random() * 0.12 : 0.2 + Math.random() * 0.3;
          p.y = Math.random() * height;
          break;
      }
    };

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, size: 2, alpha: 0.5 };
        resetParticle(p, canvas.width, canvas.height, true);
        particles.push(p);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (effect === 'stars' && p.twinkle) {
          p.alpha += p.twinkle;
          if (p.alpha > 0.95 || p.alpha < 0.15) {
            p.twinkle = -p.twinkle;
          }
        }

        // Out of bounds check
        if (p.y > height + 20 || p.y < -20 || p.x > width + 20 || p.x < -20) {
          resetParticle(p, width, height);
        }

        // Draw particle
        ctx.save();
        if (effect === 'rain') {
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
          ctx.stroke();
        } else if (effect === 'embers') {
          ctx.fillStyle = p.color || '#f97316';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (effect === 'bokeh') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [effect]);

  if (effect === 'none') return null;

  if (effect === 'scanlines') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-30 mix-blend-overlay"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04))',
          backgroundSize: '100% 3px, 4px 100%',
        }}
      />
    );
  }

  if (effect === 'grain') {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-15 mix-blend-screen bg-repeat animate-pulse"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 w-full h-full"
    />
  );
};
