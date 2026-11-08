import React, { useState } from 'react';
import {
  Settings,
  Palette,
  ShieldAlert,
  Cpu,
  Tv,
  RotateCcw,
  Download,
  Check,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  CURATED_PALETTES,
  exportThemeJson,
  encodeThemeCode,
  decodeThemeCode,
  ThemeMode,
  CornerStyle,
  DensityStyle,
} from '@myujiku/shared';

export const SettingsView: React.FC = () => {
  const { settings, updateTheme, updateSettings, resetSection, setYoutubeConsent } = useSettingsStore();
  const [themeCodeInput, setThemeCodeInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleExportJson = () => {
    const json = exportThemeJson(settings.theme);
    navigator.clipboard.writeText(json);
    setCopyStatus('Theme JSON copied to clipboard!');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  const handleExportCode = () => {
    const code = encodeThemeCode(settings.theme);
    navigator.clipboard.writeText(code);
    setCopyStatus(`Theme code copied: ${code}`);
    setTimeout(() => setCopyStatus(null), 2500);
  };

  const handleImportCode = () => {
    if (!themeCodeInput) return;
    try {
      const decoded = decodeThemeCode(themeCodeInput.trim());
      updateTheme(decoded);
      setThemeCodeInput('');
      setCopyStatus('Theme applied successfully!');
      setTimeout(() => setCopyStatus(null), 2500);
    } catch {
      alert('Invalid theme code format.');
    }
  };

  return (
    <div className="w-full h-full p-8 max-w-4xl mx-auto space-y-8 animate-fade-in overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">Settings & Customization</h1>
            <p className="text-xs text-zinc-400">Design tokens, toolchain controls, and engine preferences</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => resetSection('all')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 bg-bg-surface hover:bg-white/5 border border-border-subtle clip-chamfer-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Settings</span>
        </button>
      </div>

      {/* Copy / Notification Banner */}
      {copyStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono clip-chamfer-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{copyStatus}</span>
        </div>
      )}

      {/* 1. Appearance & Theme Settings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent">
            <Palette className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Appearance & Theming</h2>
          </div>
          <button
            type="button"
            onClick={() => resetSection('theme')}
            className="text-[11px] text-zinc-400 hover:text-accent flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Theme</span>
          </button>
        </div>

        <div className="p-5 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-5">
          {/* Theme Mode */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Base Surface Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {(['amoled', 'dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateTheme({ mode })}
                  className={`py-2 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm border transition-colors ${
                    settings.theme.mode === mode
                      ? 'bg-accent text-white border-accent shadow-[0_0_12px_var(--color-accent-glow)]'
                      : 'bg-bg-elevated/60 text-zinc-400 border-border-subtle hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Palettes */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Curated OKLCH Accent Palettes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CURATED_PALETTES.map((pal) => {
                const isSelected =
                  Math.abs(settings.theme.accentHue - pal.accent.h) < 5 &&
                  !settings.theme.followCoverArt;

                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() =>
                      updateTheme({
                        accentHue: pal.accent.h,
                        accentChroma: pal.accent.c,
                        accentLightness: pal.accent.l,
                        followCoverArt: false,
                      })
                    }
                    className={`p-2.5 text-left border clip-chamfer-sm transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/20 text-white'
                        : 'border-border-subtle bg-bg-elevated/40 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `oklch(70% 0.2 ${pal.accent.h})` }}
                      />
                      <span className="text-xs font-bold truncate">{pal.name}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{pal.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corner Style & Density */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">Corner Treatment</label>
              <div className="flex gap-2">
                {(['chamfer', 'sharp', 'soft'] as CornerStyle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateTheme({ cornerStyle: c })}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase clip-chamfer-sm border ${
                      settings.theme.cornerStyle === c
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-elevated/60 text-zinc-400 border-border-subtle'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">Layout Density</label>
              <div className="flex gap-2">
                {(['compact', 'comfortable', 'spacious'] as DensityStyle[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateTheme({ density: d })}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase clip-chamfer-sm border ${
                      settings.theme.density === d
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-elevated/60 text-zinc-400 border-border-subtle'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* UI Scale Slider */}
          <div>
            <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
              <span className="font-semibold">UI Scale (80% to 150%)</span>
              <span className="font-mono text-accent">{settings.theme.uiScale}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="150"
              step="5"
              value={settings.theme.uiScale}
              onChange={(e) => updateTheme({ uiScale: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 accent-accent bg-white/10 rounded cursor-pointer"
            />
          </div>

          {/* Theme Share / Import / Export */}
          <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Share Code</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={themeCodeInput}
                onChange={(e) => setThemeCodeInput(e.target.value)}
                placeholder="Paste MYU- code..."
                className="px-2.5 py-1 text-xs bg-black border border-border-subtle clip-chamfer-sm text-white font-mono placeholder-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportCode}
                className="px-3 py-1 text-xs bg-accent text-white font-semibold clip-chamfer-sm"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. YouTube & yt-dlp Tool Manager */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500">
            <ShieldAlert className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">YouTube via yt-dlp</h2>
          </div>
          <button
            type="button"
            onClick={() => resetSection('youtube')}
            className="text-[11px] text-zinc-400 hover:text-accent flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset YouTube Settings</span>
          </button>
        </div>

        <div className="p-5 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">YouTube Source Master Killswitch</p>
              <p className="text-zinc-400 mt-0.5">
                Current status: {settings.youtubeConsentAccepted ? 'Consented & Active' : 'Disabled (Revoked)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setYoutubeConsent(!settings.youtubeConsentAccepted)}
              className={`px-4 py-1.5 font-semibold uppercase tracking-wider clip-chamfer-sm text-xs transition-colors ${
                settings.youtubeConsentAccepted
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {settings.youtubeConsentAccepted ? 'Revoke Consent' : 'Enable YouTube'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">yt-dlp Release Channel</p>
              <p className="text-zinc-400 mt-0.5">Checked at startup and automatically updated on stream errors</p>
            </div>
            <select
              value={settings.ytDlpChannel}
              onChange={(e) => updateSettings({ ytDlpChannel: e.target.value as 'stable' | 'nightly' })}
              className="bg-bg-elevated border border-border-subtle clip-chamfer-sm text-xs text-white px-2 py-1 focus:outline-none"
            >
              <option value="stable">Stable (Recommended)</option>
              <option value="nightly">Nightly</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Ephemeral Temp Cache Cap</p>
              <p className="text-zinc-400 mt-0.5">LRU evicted and wiped clean on application startup and exit</p>
            </div>
            <span className="font-mono text-zinc-300 font-semibold">{settings.tempCacheCapMb} MB (Max)</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Official YouTube Embed Fallback</p>
              <p className="text-zinc-400 mt-0.5">Offers official iframe player (no effects) when yt-dlp is off or broken</p>
            </div>
            <input
              type="checkbox"
              checked={settings.officialEmbedFallback}
              onChange={(e) => updateSettings({ officialEmbedFallback: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Internet Archive Provider (Optional)</p>
              <p className="text-zinc-400 mt-0.5">Enables searching open-license historical audio & live concerts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.archiveProviderEnabled ?? false}
              onChange={(e) => updateSettings({ archiveProviderEnabled: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>
        </div>
      </section>

      {/* 3. Word-Sync Aligner Engine */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400">
            <Cpu className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Enhanced Sync Aligner Engine</h2>
          </div>
          <button
            type="button"
            onClick={() => resetSection('aligner')}
            className="text-[11px] text-zinc-400 hover:text-accent flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Aligner</span>
          </button>
        </div>

        <div className="p-5 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4 text-xs">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">Engine Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['off', 'local', 'remote'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateSettings({ alignerMode: m })}
                  className={`py-2 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm border ${
                    settings.alignerMode === m
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-elevated/60 text-zinc-400 border-border-subtle hover:text-white'
                  }`}
                >
                  {m === 'off' ? 'Off' : m === 'local' ? 'Local Sidecar' : 'Remote URL'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Auto-align New Songs</p>
              <p className="text-zinc-400 mt-0.5">Automatically converts plain lyrics to word-level timestamps in background</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAlignNewSongs}
              onChange={(e) => updateSettings({ autoAlignNewSongs: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Whisper Alignment Model</p>
              <p className="text-zinc-400 mt-0.5">Model used for forced alignment of lyric lines to audio</p>
            </div>
            <select
              value={settings.selectedAlignerModel}
              onChange={(e) => updateSettings({ selectedAlignerModel: e.target.value as 'tiny' | 'base' | 'small' })}
              className="bg-bg-elevated border border-border-subtle clip-chamfer-sm text-xs text-white px-2 py-1 focus:outline-none"
            >
              <option value="tiny">Tiny (Fastest, CPU friendly)</option>
              <option value="base">Base (Balanced)</option>
              <option value="small">Small (Highest precision)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Separate Vocals First (Demucs, slower)</p>
              <p className="text-zinc-400 mt-0.5">Isolates vocal stem before alignment for cleaner results on loud mixes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.separateVocalsForAlignment}
              onChange={(e) => updateSettings({ separateVocalsForAlignment: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>

          {settings.alignerMode === 'remote' && (
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Remote Aligner URL</label>
                <input
                  type="text"
                  value={settings.alignerRemoteUrl || ''}
                  onChange={(e) => updateSettings({ alignerRemoteUrl: e.target.value })}
                  placeholder="https://aligner.example.com"
                  className="w-full px-2.5 py-1 text-xs bg-black border border-border-subtle clip-chamfer-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">API Key / Token (Optional)</label>
                <input
                  type="password"
                  value={settings.alignerApiKey || ''}
                  onChange={(e) => updateSettings({ alignerApiKey: e.target.value })}
                  placeholder="X-MyuJiku-Sidecar-Token"
                  className="w-full px-2.5 py-1 text-xs bg-black border border-border-subtle clip-chamfer-sm text-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              {settings.alignerMode === 'off'
                ? 'Alignment engine is currently disabled.'
                : `Engine running in ${settings.alignerMode} mode.`}
            </span>
            <button
              type="button"
              onClick={async () => {
                const { AlignerClient } = await import('../../aligner/AlignerClient');
                const isHealthy = await AlignerClient.getInstance().checkHealth();
                alert(isHealthy ? 'Aligner connection test SUCCESSFUL! (Service healthy)' : 'Could not reach aligner service at endpoint.');
              }}
              className="px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-accent font-semibold"
            >
              Test Aligner Connection
            </button>
          </div>
        </div>
      </section>

      {/* 4. Discord Rich Presence */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Tv className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Discord Rich Presence</h2>
          </div>
        </div>

        <div className="p-5 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Show "Listening to MyuJiku" in Discord</p>
              <p className="text-zinc-400 mt-0.5">Connects automatically to local Discord desktop client via native IPC</p>
            </div>
            <input
              type="checkbox"
              checked={settings.discordPresenceEnabled}
              onChange={(e) => updateSettings({ discordPresenceEnabled: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <div>
              <p className="font-semibold text-white">Hide Song Details (Privacy Mode)</p>
              <p className="text-zinc-400 mt-0.5">Shows that you are listening to MyuJiku without broadcasting the song title</p>
            </div>
            <input
              type="checkbox"
              checked={settings.discordHideSongDetails}
              onChange={(e) => updateSettings({ discordHideSongDetails: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
