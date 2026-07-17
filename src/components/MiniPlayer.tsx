import { useLocation } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { audioEngine } from '../services/audioEngine';
import { formatTime } from '../utils/formatTime';

interface MiniPlayerProps {
  onOpenSheet: () => void;
}

export function MiniPlayer({ onOpenSheet }: MiniPlayerProps) {
  const location = useLocation();
  const { currentAudio, isPlaying, currentTime, currentSegmentIndex, toggle, stop } = usePlayerStore();
  const { loopMode, playbackSpeed, setLoopMode, setPlaybackSpeed } = useSettingsStore();

  // Hide MiniPlayer on PlayerView route
  const isOnPlayerRoute = location.pathname.startsWith('/play/');
  if (!currentAudio || isOnPlayerRoute) return null;

  const progress = currentAudio.duration ? (currentTime / currentAudio.duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40">
      <div
        onClick={onOpenSheet}
        className="relative overflow-hidden bg-[var(--color-surface-container-low)]/95 backdrop-blur-md border border-[var(--color-primary)]/20 rounded-lg cursor-pointer"
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-surface-container)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 p-2">
          {/* Waveform icon */}
          <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center shrink-0">
            <Icon name="bar_chart" size={24} className="text-[var(--color-primary)]" />
          </div>

          {/* Title & time */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="overflow-hidden">
              <div className="animate-marquee inline-flex whitespace-nowrap">
                <span className="font-semibold text-[var(--color-text-base)] text-sm pr-8">
                  {currentAudio.name}
                </span>
                <span className="font-semibold text-[var(--color-text-base)] text-sm pr-8">
                  {currentAudio.name}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {formatTime(currentTime)} / {formatTime(currentAudio.duration)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Speed Toggle */}
            <button
              onClick={() => {
                const newSpeed = playbackSpeed === 'default' ? 'slow' : 'default';
                setPlaybackSpeed(newSpeed);
                audioEngine.setSpeed(newSpeed);
              }}
              className={`w-10 h-10 rounded-full text-xs font-bold transition-colors ${
                playbackSpeed === 'slow'
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {playbackSpeed === 'slow' ? '0.75x' : '1x'}
            </button>
            {/* Loop Toggle: none → all → sentence */}
            <button
              onClick={() => {
                const modes = ['none', 'all', 'sentence'] as const;
                const currentIndex = modes.indexOf(loopMode as typeof modes[number]);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setLoopMode(nextMode);
                if (nextMode === 'sentence' && currentAudio?.transcript) {
                  const segment = currentAudio.transcript[currentSegmentIndex];
                  if (segment) {
                    audioEngine.setLoop(segment.startTime, segment.endTime);
                  }
                } else if (nextMode === 'all') {
                  audioEngine.setLoop(null, null);
                  audioEngine.setLoopAll(true);
                } else {
                  audioEngine.setLoop(null, null);
                  audioEngine.setLoopAll(false);
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                loopMode !== 'none'
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon name={loopMode === 'sentence' ? 'repeat_one' : 'repeat'} filled={loopMode !== 'none'} size={22} />
            </button>
            {/* Play/Pause */}
            <button
              onClick={toggle}
              className="p-1 text-[var(--color-primary)]"
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled size={32} />
            </button>
            {/* Close */}
            <button
              onClick={stop}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
              title="Close"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
