import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface ConstellationStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const ConstellationStage: React.FC<ConstellationStageProps> = ({
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

    // Create celestial node points for visible lines
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const totalVisible = 5;
      const startIdx = Math.max(0, activeLineIndex - 2);
      const visibleLines = lyrics.slice(startIdx, startIdx + totalVisible);

      if (visibleLines.length === 0) return;

      const centerX = width / 2;
      const stepY = height / (visibleLines.length + 1);

      const nodeCoords: Array<{ x: number; y: number; isCurrent: boolean; line: SyncedLyricLine }> = [];

      visibleLines.forEach((line, idx) => {
        const actualIdx = startIdx + idx;
        const isCurrent = actualIdx === activeLineIndex;
        // Orbit wave offset
        const offsetX = Math.sin(actualIdx * 1.2) * (width * 0.18);
        const x = centerX + offsetX;
        const y = stepY * (idx + 1);
        nodeCoords.push({ x, y, isCurrent, line });
      });

      // Draw constellation connecting lines
      ctx.beginPath();
      for (let i = 0; i < nodeCoords.length; i++) {
        const node = nodeCoords[i];
        if (i === 0) {
          ctx.moveTo(node.x, node.y);
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw glowing nodes and text
      nodeCoords.forEach((node) => {
        ctx.beginPath();
        if (node.isCurrent) {
          // Radiant halo
          const gradient = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 24);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 1)');
          gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = gradient;
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.font = '16px sans-serif';
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.line.text, node.x, node.y + (node.isCurrent ? 36 : 22));
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

