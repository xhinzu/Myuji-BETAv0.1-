import React from 'react';
import { Folder, Upload, Heart, ListPlus, Music2, FolderPlus } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export const LibraryView: React.FC = () => {
  const { addToQueue, setCurrentTrack, setIsPlaying } = usePlayerStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const track = {
        id: `local:${file.name}`,
        source: 'local' as const,
        sourceId: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        duration: 0,
        audioUrl: url,
        capabilities: { rawAudio: true, canDownloadForAlignment: true },
      };

      if (i === 0) {
        setCurrentTrack(track);
        setIsPlaying(true);
      } else {
        addToQueue(track);
      }
    }
  };

  return (
    <div className="w-full h-full p-8 max-w-5xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Folder className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold tracking-wider uppercase text-white">Your Music Library</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm cursor-pointer shadow-[0_0_12px_var(--color-accent-glow)] transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom Audio</span>
            <input
              type="file"
              accept="audio/*,.lrc,.elrc"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Quick Category Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md flex items-center gap-4 hover:border-accent transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 clip-chamfer-sm flex items-center justify-center">
            <Heart className="w-6 h-6 fill-rose-500/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Liked Songs</h3>
            <p className="text-xs text-zinc-400">All your favorite tracks</p>
          </div>
        </div>

        <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md flex items-center gap-4 hover:border-accent transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 text-accent clip-chamfer-sm flex items-center justify-center">
            <ListPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Collections</h3>
            <p className="text-xs text-zinc-400">Custom user playlists</p>
          </div>
        </div>

        <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md flex items-center gap-4 hover:border-accent transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 clip-chamfer-sm flex items-center justify-center">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Local Folders</h3>
            <p className="text-xs text-zinc-400">Watched directories</p>
          </div>
        </div>
      </div>

      {/* Drag and Drop parity area */}
      <div className="border-2 border-dashed border-border-base hover:border-accent clip-chamfer p-10 flex flex-col items-center justify-center text-center transition-colors bg-bg-surface/40">
        <Music2 className="w-10 h-10 text-zinc-400 mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Drag and drop audio files here</h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-4">
          Supports MP3, FLAC, WAV, OGG, AAC/M4A, OPUS and sidecar .lrc / .elrc lyrics files.
        </p>
        <label className="px-4 py-2 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs font-semibold text-zinc-200 cursor-pointer transition-colors">
          Browse Files
          <input
            type="file"
            accept="audio/*,.lrc,.elrc"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
