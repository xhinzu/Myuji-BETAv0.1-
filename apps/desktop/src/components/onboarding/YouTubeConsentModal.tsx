import React from 'react';
import {
  ShieldAlert,
  HardDrive,
  EyeOff,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigationStore } from '../../stores/navigationStore';

export const YouTubeConsentModal: React.FC = () => {
  const { settings, setYoutubeConsent } = useSettingsStore();
  const { isOnboardingOpen, setOnboardingOpen } = useNavigationStore();

  if (!isOnboardingOpen && settings.youtubeConsentAccepted) {
    return null;
  }

  const handleAccept = () => {
    setYoutubeConsent(true);
    setOnboardingOpen(false);
  };

  const handleDecline = () => {
    setYoutubeConsent(false);
    setOnboardingOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-labelledby="consent-title"
    >
      <div className="w-full max-w-xl bg-bg-surface border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 id="consent-title" className="text-base font-bold text-white tracking-wide uppercase">
              YouTube Source & yt-dlp Tool Consent
            </h2>
            <p className="text-xs text-zinc-400">
              Please review how MyuJiku interacts with YouTube before enabling.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-3.5 text-xs text-zinc-300">
          <div className="flex gap-3 p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
            <EyeOff className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Local-Only Execution</p>
              <p className="text-zinc-400 mt-0.5">
                Resolution runs strictly on your own device using the open-source <code>yt-dlp</code> utility. No server proxies or third-party scrapers are used.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
            <HardDrive className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">No Audio Saved or Exported</p>
              <p className="text-zinc-400 mt-0.5">
                Streamed audio is kept only in an ephemeral OS temporary cache (size-capped at 500 MB LRU) and wiped on application exit and startup. There is no feature to download or export YouTube tracks.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Terms of Service & Responsibility</p>
              <p className="text-zinc-400 mt-0.5">
                Direct stream resolution may conflict with YouTube's Terms of Service and may break when YouTube updates its platform. You acknowledge and accept responsibility for enabling this source.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-bg-elevated/50 border border-border-subtle clip-chamfer-sm">
            <HelpCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Killswitch & Official Fallback</p>
              <p className="text-zinc-400 mt-0.5">
                You can revoke consent anytime in Settings. If disabled or failing, the app offers the official YouTube IFrame Embed fallback mode.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-white bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Keep Disabled</span>
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-accent hover:bg-accent-hover shadow-[0_0_15px_var(--color-accent-glow)] clip-chamfer-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Accept & Enable YouTube</span>
          </button>
        </div>
      </div>
    </div>
  );
};

