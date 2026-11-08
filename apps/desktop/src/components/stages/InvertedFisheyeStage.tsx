import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface InvertedFisheyeStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const InvertedFisheyeStage: React.FC<InvertedFisheyeStageProps> = ({
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

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      phase += 0.02;

      const centerX = width / 2;
      const centerY = height / 2;

      // Pinch liquid vortex ring
      const pinchGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 280);
      pinchGrad.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
      pinchGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.15)');
      pinchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = pinchGrad;
      ctx.fillRect(0, 0, width, height);

      // Render pinched lines
      const currentLine = lyrics[activeLineIndex];
      const prevLine = lyrics[activeLineIndex - 1];
      const nextLine = lyrics[activeLineIndex + 1];

      if (prevLine) {
        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(prevLine.text, centerX, centerY - 60);
      }

      if (currentLine) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 42px monospace';
        ctx.fillStyle = '#ffffff';

        // Chromatic split offset
        const split = Math.sin(phase) * 3;
        ctx.shadowColor = 'rgba(236, 72, 153, 0.9)';
        ctx.shadowBlur = 25;
        ctx.fillText(currentLine.text, centerX + split, centerY);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      if (nextLine) {
        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.textAlign = 'center';
        ctx.fillText(nextLine.text, centerX, centerY + 60);
      }

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
