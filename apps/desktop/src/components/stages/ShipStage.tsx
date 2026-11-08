import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface ShipStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const ShipStage: React.FC<ShipStageProps> = ({
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

    const tunnelRings = 8;
    let angleOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angleOffset += 0.015;

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw 3D tunnel corridor rings
      for (let i = 1; i <= tunnelRings; i++) {
        const radius = (i / tunnelRings) * (Math.min(width, height) * 0.45);
        const alpha = (i / tunnelRings) * 0.4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Warp spokes
        for (let s = 0; s < 4; s++) {
          const theta = (s * Math.PI) / 2 + angleOffset;
          const sx = centerX + Math.cos(theta) * radius;
          const sy = centerY + Math.sin(theta) * radius;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fill();
        }
      }

      // Draw Center Cockpit Target
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.8)';
      ctx.fill();

      // Render Active Lyrics Line at center
      const currentLine = lyrics[activeLineIndex];
      const nextLine = lyrics[activeLineIndex + 1];

      if (currentLine) {
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText(currentLine.text, centerX, centerY + 65);
        ctx.shadowBlur = 0;
      }

      if (nextLine) {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(nextLine.text, centerX, centerY + 110);
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
