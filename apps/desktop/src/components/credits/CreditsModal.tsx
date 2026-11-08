import React from 'react';
import { X, Award, ExternalLink, Heart } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { ASSET_LICENSES } from '@myujiku/shared';

export const CreditsModal: React.FC = () => {
  const { isCreditsModalOpen, setCreditsModalOpen } = useNavigationStore();

  if (!isCreditsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setCreditsModalOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Credits and Licenses"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Credits, Sources & Open Source Licenses
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCreditsModalOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Music Source Attributions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
            Music Catalog & Providers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
              <p className="font-semibold text-white">Audius Catalog</p>
              <p className="text-zinc-400 mt-1 text-[11px]">
                Streamed via the official Audius Web3 decentralized API with artist credits and profile attribution links.
              </p>
            </div>
            <div className="p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
              <p className="font-semibold text-white">Jamendo Licensing</p>
              <p className="text-zinc-400 mt-1 text-[11px]">
                Powered by Jamendo API under Creative Commons licenses. Non-commercial personal desktop listening.
              </p>
            </div>
            <div className="p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
              <p className="font-semibold text-white">LRCLIB Community</p>
              <p className="text-zinc-400 mt-1 text-[11px]">
                Crowdsourced line and word synced lyrics fetched through the open LRCLIB database API.
              </p>
            </div>
            <div className="p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
              <p className="font-semibold text-white">YouTube via yt-dlp</p>
              <p className="text-zinc-400 mt-1 text-[11px]">
                Ephemeral client-side resolution running locally via yt-dlp after explicit user consent.
              </p>
            </div>
          </div>
        </div>

        {/* Core Technology Stack */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
            Open Source Frameworks & Tools
          </h3>
          <div className="p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300 space-y-1.5">
            <p><strong>Tauri 2 & Rust:</strong> High-performance native Windows desktop runtime & security sandbox (MIT / Apache 2.0).</p>
            <p><strong>React 19 & Vite:</strong> Declarative component architecture and sub-millisecond HMR (MIT).</p>
            <p><strong>Tailwind CSS & OKLCH:</strong> Perceptually uniform design tokens and responsive stylesheets (MIT).</p>
            <p><strong>OpenAI Whisper & stable-ts:</strong> Timestamped forced alignment speech recognition engine (MIT).</p>
          </div>
        </div>

        {/* Asset Licenses Manifest */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
            Icon & Vector Asset Licenses
          </h3>
          <div className="space-y-2 text-xs text-zinc-400">
            {Object.entries(ASSET_LICENSES).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-bg-elevated/30 border border-border-subtle clip-chamfer-sm">
                <span className="font-mono text-white text-[11px]">{item.name}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-accent hover:underline"
                >
                  <span>License Terms</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-accent fill-accent" />
          <span>for music lovers everywhere</span>
        </div>
      </div>
    </div>
  );
};
