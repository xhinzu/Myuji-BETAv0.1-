import React, { useState } from 'react';
import { Sliders, Volume2, VolumeX, Disc, CloudRain, Flame, Trees } from 'lucide-react';
import { AmbientEngine, AmbientTrackId } from '../../audio/AmbientEngine';

interface AmbientSound {
  id: AmbientTrackId;
  name: string;
  file: string;
  category: string;
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Rainfall', file: 'rain.mp3', category: 'Weather' },
  { id: 'thunder', name: 'Thunder', file: 'thunder.mp3', category: 'Weather' },
  { id: 'wind', name: 'Wind Gusts', file: 'wind.mp3', category: 'Weather' },
  { id: 'birds', name: 'Morning Birds', file: 'birds.mp3', category: 'Nature' },
  { id: 'fireplace', name: 'Crackling Fire', file: 'fireplace.mp3', category: 'Cozy' },
  { id: 'crickets', name: 'Night Crickets', file: 'crickets.mp3', category: 'Nature' },
  { id: 'waves', name: 'Ocean Waves', file: 'waves.mp3', category: 'Nature' },
  { id: 'chatter', name: 'Cafe Chatter', file: 'chatter.mp3', category: 'Ambience' },
  { id: 'bass', name: 'Sub Bass Drone', file: 'bass.mp3', category: 'Tones' },
  { id: 'drums', name: 'Lo-Fi Drums', file: 'drums.mp3', category: 'Tones' },
];

export const MixerView: React.FC = () => {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const engine = AmbientEngine.getInstance();

  const handleVolumeChange = (id: AmbientTrackId, val: number) => {
    setVolumes((prev) => ({ ...prev, [id]: val }));
    engine.setChannelVolume(id, val);
  };

  const applyPreset = (preset: 'cozy' | 'storm' | 'forest') => {
    let presetVols: Partial<Record<AmbientTrackId, number>> = {};
    if (preset === 'cozy') {
      presetVols = { fireplace: 0.6, rain: 0.35, chatter: 0.2 };
    } else if (preset === 'storm') {
      presetVols = { rain: 0.75, thunder: 0.5, wind: 0.4 };
    } else if (preset === 'forest') {
      presetVols = { birds: 0.6, wind: 0.3, crickets: 0.25 };
    }

    engine.stopAll();
    const next: Record<string, number> = {};
    for (const [id, vol] of Object.entries(presetVols)) {
      const trackId = id as AmbientTrackId;
      next[trackId] = vol!;
      engine.setChannelVolume(trackId, vol!);
    }
    setVolumes(next);
  };

  return (
    <div className="w-full h-full p-8 max-w-5xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">Atmosphere & Soundscape Mixer</h1>
            <p className="text-xs text-zinc-400">Layer procedural natural textures over your music</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('cozy')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-surface hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300 hover:text-white transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Cozy Fire</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('storm')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-surface hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300 hover:text-white transition-colors"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Rainstorm</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('forest')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-surface hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300 hover:text-white transition-colors"
          >
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Forest Twilight</span>
          </button>
        </div>
      </div>

      {/* 10 Ambient Loops Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {AMBIENT_SOUNDS.map((snd) => {
          const currentVol = volumes[snd.id] || 0;
          const isActive = currentVol > 0;

          return (
            <div
              key={snd.id}
              className={`p-3.5 bg-bg-surface/80 border clip-chamfer backdrop-blur-md transition-all ${
                isActive ? 'border-accent shadow-[0_0_12px_var(--color-accent-glow)]' : 'border-border-base'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white truncate">{snd.name}</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {Math.round(currentVol * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={currentVol}
                onChange={(e) => handleVolumeChange(snd.id, parseFloat(e.target.value))}
                className="w-full h-1.5 accent-accent bg-white/10 rounded cursor-pointer"
              />
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-border-subtle text-[10px] text-zinc-500">
                <span>{snd.category}</span>
                <button
                  type="button"
                  onClick={() => handleVolumeChange(snd.id, currentVol > 0 ? 0 : 0.5)}
                  className="hover:text-white"
                >
                  {currentVol > 0 ? <Volume2 className="w-3 h-3 text-accent" /> : <VolumeX className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Vinyl Scratch Deck Simulation */}
      <div className="p-6 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Disc className="w-5 h-5 text-accent animate-spin" style={{ animationDuration: '4s' }} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dual Vinyl Turntable Emulation
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Direct scratch physics & crackle</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm flex flex-col items-center justify-center py-8">
            <div className="w-32 h-32 rounded-full border-4 border-zinc-700 bg-black flex items-center justify-center relative shadow-inner cursor-grab active:cursor-grabbing hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-[10px] font-mono text-white">
                DECK A
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3 font-mono">Channel 1 (Vinyl Lead)</p>
          </div>

          <div className="p-4 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm flex flex-col items-center justify-center py-8">
            <div className="w-32 h-32 rounded-full border-4 border-zinc-700 bg-black flex items-center justify-center relative shadow-inner cursor-grab active:cursor-grabbing hover:border-accent transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-[10px] font-mono text-white">
                DECK B
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3 font-mono">Channel 2 (Vinyl Scratch)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
