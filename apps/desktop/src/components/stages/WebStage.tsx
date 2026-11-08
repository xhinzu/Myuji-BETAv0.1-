import React, { useEffect, useRef } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface WebStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

interface WebNode {
  id: string;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lineIdx: number;
  time: number;
  isActive: boolean;
  radius: number;
}

interface WebEdge {
  source: string;
  target: string;
}

export const WebStage: React.FC<WebStageProps> = ({
  lyrics,
  activeLineIndex,
  activeWordIndex,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<WebNode[]>([]);
  const edgesRef = useRef<WebEdge[]>([]);

  // Build nodes and edges around the current active lyric window
  useEffect(() => {
    const windowStart = Math.max(0, activeLineIndex - 2);
    const windowEnd = Math.min(lyrics.length, activeLineIndex + 3);
    const windowLines = lyrics.slice(windowStart, windowEnd);

    const newNodes: WebNode[] = [];
    const wordMap = new Map<string, string[]>(); // normalized text -> node IDs

    const width = 800;
    const height = 450;
    const centerX = width / 2;
    const centerY = height / 2;

    windowLines.forEach((line, lOffset) => {
      const lineIdx = windowStart + lOffset;
      const isLineActive = lineIdx === activeLineIndex;

      // Create a node for key words or the line itself
      const words = line.words && line.words.length > 0 
        ? line.words 
        : line.text.split(' ').map((t, idx) => ({ text: t, start: line.start + idx * 0.3, end: line.start + (idx + 1) * 0.3 }));

      words.forEach((w, wIdx) => {
        const isWordActive = isLineActive && wIdx === activeWordIndex;
        const norm = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!norm) return;

        // Initial positions radiating around center
        const angle = (lOffset * 1.2) + (wIdx * 0.4);
        const dist = isLineActive ? 60 + wIdx * 25 : 140 + lOffset * 40;
        const x = centerX + Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
        const y = centerY + Math.sin(angle) * dist + (Math.random() - 0.5) * 20;

        const nodeId = `node-${lineIdx}-${wIdx}`;
        newNodes.push({
          id: nodeId,
          text: w.text,
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          lineIdx,
          time: w.start,
          isActive: isWordActive,
          radius: isWordActive ? 24 : isLineActive ? 16 : 10,
        });

        if (!wordMap.has(norm)) {
          wordMap.set(norm, []);
        }
        wordMap.get(norm)!.push(nodeId);
      });
    });

    // Create edges between consecutive words and between matching words
    const newEdges: WebEdge[] = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      if (newNodes[i].lineIdx === newNodes[i + 1].lineIdx) {
        newEdges.push({ source: newNodes[i].id, target: newNodes[i + 1].id });
      }
    }

    wordMap.forEach((ids) => {
      if (ids.length > 1) {
        for (let i = 0; i < ids.length - 1; i++) {
          newEdges.push({ source: ids[i], target: ids[i + 1] });
        }
      }
    });

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;
  }, [lyrics, activeLineIndex, activeWordIndex]);

  // Canvas animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Physics update: simple spring/repulsion
      const kRepulsion = 1200;
      const kSpring = 0.02;
      const damping = 0.88;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = kRepulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      edges.forEach((edge) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 70;
          const force = (dist - targetDist) * kSpring;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // Central gravity
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.002;
        n.vy += (cy - n.y) * 0.002;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Draw edges
      ctx.lineWidth = 1;
      edges.forEach((edge) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (s && t) {
          const isHighlight = s.isActive || t.isActive;
          ctx.strokeStyle = isHighlight ? 'rgba(56, 189, 248, 0.7)' : 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

        if (n.isActive) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (n.lineIdx === activeLineIndex) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
        }

        // Label
        ctx.font = n.isActive ? 'bold 15px sans-serif' : '12px sans-serif';
        ctx.fillStyle = n.isActive ? '#ffffff' : n.lineIdx === activeLineIndex ? '#e2e8f0' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(n.text, n.x, n.y - n.radius - 6);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeLineIndex]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find clicked node
    for (const node of nodesRef.current) {
      const dx = clickX - node.x;
      const dy = clickY - node.y;
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 10) {
        onSeek(node.time);
        break;
      }
    }
  };

  const currentLine = lyrics[activeLineIndex];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 py-2">
      {currentLine && (
        <div 
          onClick={() => onSeek(currentLine.start)}
          className="text-2xl md:text-3xl font-bold text-center text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.5)] mb-3 cursor-pointer select-none"
        >
          {currentLine.text}
        </div>
      )}

      <div className="relative w-full aspect-[16/9] max-h-[480px] rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
        />
        <div className="absolute bottom-3 right-4 text-xs text-white/40 pointer-events-none">
          🕸️ Force-Directed Lyric Semantic Graph • Click node to seek
        </div>
      </div>
    </div>
  );
};
