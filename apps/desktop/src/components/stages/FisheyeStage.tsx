import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface FisheyeStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const FisheyeStage: React.FC<FisheyeStageProps> = ({
  lyrics,
  activeLineIndex,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const lensRadius = Math.min(width, height) * 0.42;

      // Draw spherical lens perimeter
      const lensGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, lensRadius);
      lensGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      lensGradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.01)');
      lensGradient.addColorStop(1, 'rgba(56, 189, 248, 0.2)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, lensRadius, 0, Math.PI * 2);
      ctx.fillStyle = lensGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Render lines with barrel curvature distortion
      const startIdx = Math.max(0, activeLineIndex - 2);
      const visibleLines = lyrics.slice(startIdx, activeLineIndex + 3);

      visibleLines.forEach((line, idx) => {
        const actualIdx = startIdx + idx;
        const isCurrent = actualIdx === activeLineIndex;
        const distFromCenter = actualIdx - activeLineIndex;

        // Fisheye spherical magnification
        const scale = isCurrent ? 1.3 : 1 / (1 + Math.abs(distFromCenter) * 0.4);
        const yOffset = distFromCenter * 65 * scale;
        const yPos = centerY + yOffset;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isCurrent) {
          ctx.font = 'bold 38px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
          ctx.shadowBlur = 20;
          ctx.fillText(line.text, centerX, yPos);
        } else {
          ctx.font = '20px sans-serif';
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.15, 0.5 - Math.abs(distFromCenter) * 0.15)})`;
          ctx.fillText(line.text, centerX, yPos);
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [lyrics, activeLineIndex]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={() => {
          const line = lyrics[activeLineIndex];
          if (line) onSeek(line.start);
        }}
        className="w-full h-full cursor-pointer"
      />
    </div>
  );
};

