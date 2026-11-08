import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface BranchesStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const BranchesStage: React.FC<BranchesStageProps> = ({
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

    const drawBranch = (
      startX: number,
      startY: number,
      len: number,
      angle: number,
      branchWidth: number,
      depth: number
    ) => {
      ctx.beginPath();
      ctx.save();
      ctx.strokeStyle = `rgba(52, 211, 153, ${Math.max(0.2, 0.9 - depth * 0.15)})`;
      ctx.lineWidth = branchWidth;
      ctx.translate(startX, startY);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();

      if (depth < 4) {
        drawBranch(0, -len, len * 0.75, angle - 25, branchWidth * 0.7, depth + 1);
        drawBranch(0, -len, len * 0.75, angle + 25, branchWidth * 0.7, depth + 1);
      }
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const trunkY = height * 0.85;

      // Draw procedural organic branches
      drawBranch(centerX, trunkY, height * 0.22, 0, 8, 1);

      // Render Active Lyrics Line at crown
      const currentLine = lyrics[activeLineIndex];
      const nextLine = lyrics[activeLineIndex + 1];

      if (currentLine) {
        ctx.save();
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
        ctx.shadowBlur = 18;
        ctx.fillText(currentLine.text, centerX, height * 0.28);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      if (nextLine) {
        ctx.font = 'italic 18px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillText(nextLine.text, centerX, height * 0.35);
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
