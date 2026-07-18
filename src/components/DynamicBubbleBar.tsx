import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { audioEngine } from '../services/audioEngine';

interface DynamicBubbleBarProps {
  onOpenSheet: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  currentTab: 'home' | 'favorites';
  onTabChange: (tab: 'home' | 'favorites') => void;
}

export function DynamicBubbleBar({
  onOpenSheet,
  onOpenSearch,
  onOpenSettings,
  currentTab,
  onTabChange,
}: DynamicBubbleBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentAudio, isPlaying, toggle, stop, currentSegmentIndex, currentTime } = usePlayerStore();
  const { setLoopMode } = useSettingsStore();

  const isAudioActive = !!currentAudio;
  const shouldHide = location.pathname === '/upload';
  const progress = currentAudio?.duration ? (currentTime / currentAudio.duration) * 100 : 0;

  if (shouldHide) return null;

  const glassStyle = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const handleStop = () => {
    setLoopMode('none');
    audioEngine.setLoop(null, null);
    audioEngine.setLoopAll(false);
    audioEngine.setSpeed('default');
    stop();
  };

  const handleNextSegment = () => {
    if (!currentAudio?.transcript) return;
    const nextIndex = currentSegmentIndex + 1;
    if (nextIndex < currentAudio.transcript.length) {
      const segment = currentAudio.transcript[nextIndex];
      audioEngine.seekAndPlay(segment.startTime);
    }
  };

  return (
    <div
      className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center pointer-events-none"
      style={{
        height: '56px',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {/* LEFT: Nav Pill → Home Bubble (shrinks from RIGHT to LEFT, Home stays anchored) */}
      <div
        className="pointer-events-auto flex items-center shadow-lg overflow-hidden"
        style={{
          ...glassStyle,
          height: '56px',
          width: isAudioActive ? '56px' : '260px',
          borderRadius: '28px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Home icon wrapper - FIXED 56px, flex-shrink-0 */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '56px', height: '56px' }}
        >
          <button
            onClick={() => {
              onTabChange('home');
              if (location.pathname !== '/') navigate('/');
            }}
            className={`flex items-center justify-center w-10 h-10 transition-colors ${
              currentTab === 'home' ? 'text-[#1ed760]' : 'text-white/70'
            }`}
          >
            <Icon name="home" filled={currentTab === 'home'} size={26} />
          </button>
        </div>

        {/* Extra icons - fade out when audio active */}
        <div
          className="flex items-center gap-1"
          style={{
            opacity: isAudioActive ? 0 : 1,
            pointerEvents: isAudioActive ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Add button - next to Home */}
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center w-10 h-10 text-white/70 active:scale-90 transition-all"
          >
            <Icon name="add" size={24} />
          </button>
          <button
            disabled
            className="flex items-center justify-center w-10 h-10 text-white/40 cursor-not-allowed"
          >
            <Icon name="notifications" size={22} />
          </button>
          <button
            onClick={() => onTabChange('favorites')}
            className={`flex items-center justify-center w-10 h-10 transition-colors ${
              currentTab === 'favorites' ? 'text-[#1ed760]' : 'text-white/70'
            }`}
          >
            <Icon name="favorite" filled={currentTab === 'favorites'} size={22} />
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-10 h-10 text-white/70"
          >
            <Icon name="settings" size={22} />
          </button>
        </div>
      </div>

      {/* CENTER: Miniplayer Pill - flex-grow fills space, fades in/out */}
      <div
        onClick={isAudioActive ? onOpenSheet : undefined}
        className="pointer-events-auto flex items-center gap-2 shadow-lg relative overflow-hidden"
        style={{
          flex: 1,
          minWidth: 0,
          height: '56px',
          borderRadius: '28px',
          padding: isAudioActive ? '0 12px' : '0',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          opacity: isAudioActive ? 1 : 0,
          transform: isAudioActive ? 'scale(1)' : 'scale(0.95)',
          pointerEvents: isAudioActive ? 'auto' : 'none',
          cursor: isAudioActive ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Animated Equalizer */}
        <div className="w-9 h-9 rounded-lg bg-[var(--color-surface-container)] flex items-center justify-center gap-[2px] flex-shrink-0">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] bg-[var(--color-primary)] rounded-full"
              style={{
                height: isPlaying ? '14px' : '6px',
                animationName: isPlaying ? 'equalizer' : 'none',
                animationDuration: '0.8s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${i * 0.15}s`,
                transition: 'height 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Title with Marquee */}
        <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
          <div className="overflow-hidden">
            <span
              className="text-[11px] font-bold text-white leading-tight inline-block whitespace-nowrap"
              style={{
                animation: isPlaying ? 'marquee 8s linear infinite' : 'none',
              }}
            >
              {currentAudio?.name || ''}
            </span>
          </div>
          <span className="text-[10px] text-white/60 truncate leading-tight">
            ShadowPod
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} size={22} filled />
          </button>
          <button
            onClick={handleNextSegment}
            className="w-8 h-8 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Icon name="skip_next" size={20} filled />
          </button>
          <button
            onClick={handleStop}
            className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Progress Line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-[#4ADE80] rounded-full"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 6px rgba(74, 222, 128, 0.6)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* RIGHT: Search Bubble - simple circle */}
      <button
        onClick={onOpenSearch}
        className="pointer-events-auto flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        style={{
          ...glassStyle,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
        }}
      >
        <Icon name="search" size={26} className="text-white" />
      </button>
    </div>
  );
}
