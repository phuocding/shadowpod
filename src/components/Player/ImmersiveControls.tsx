import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { formatTime } from '../../utils/formatTime';
import type { LoopMode, PlaybackSpeed } from '../../types';

interface ImmersiveControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loopMode: LoopMode;
  playbackSpeed: PlaybackSpeed;
  isEditMode: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onLoopChange: (mode: LoopMode) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onEditToggle: () => void;
}

export function ImmersiveControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  loopMode,
  playbackSpeed,
  isEditMode,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPrevSentence,
  onNextSentence,
  onLoopChange,
  onSpeedChange,
  onEditToggle,
}: ImmersiveControlsProps) {
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getSeekTime = useCallback((clientX: number) => {
    if (!progressRef.current) return currentTime;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent * duration;
  }, [duration, currentTime]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSeek(getSeekTime(e.clientX));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onSeek(getSeekTime(clientX));
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onSeek(getSeekTime(clientX));
  }, [isDragging, getSeekTime, onSeek]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      if (progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        onSeek(percent * duration);
      }
    };
    const onEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, duration, onSeek]);

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onVolumeChange(Math.max(0, Math.min(1, percent)));
  };

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ['none', 'all', 'sentence'];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onLoopChange(modes[nextIndex]);
  };

  const cycleSpeed = () => {
    onSpeedChange(playbackSpeed === 'default' ? 'slow' : 'default');
  };

  return (
    <div className="flex flex-col gap-1 pb-4">
      {/* Row 1: Timeline */}
      <div className="flex flex-col gap-1 px-4">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="relative w-full h-[6px] bg-white/10 rounded-full cursor-pointer group touch-none"
        >
          <div
            className="absolute top-0 left-0 h-full bg-[#4ADE80] rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute w-3 h-3 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] z-10 pointer-events-none"
            style={{
              left: `${progress}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-medium text-white/40 tracking-wider">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Row 2: Playback Cluster */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={onPrevSentence}
          className="p-4 text-white/90 hover:text-white transition-colors active:scale-90"
        >
          <Icon name="skip_previous" filled size={36} />
        </button>
        <button
          onClick={onPlayPause}
          className="w-14 h-14 bg-[#4ADE80] rounded-full flex items-center justify-center shadow-[0_12px_32px_rgba(74,222,128,0.25)] hover:scale-105 active:scale-95 transition-all"
        >
          <Icon
            name={isPlaying ? 'pause' : 'play_arrow'}
            filled
            size={36}
            className="text-black"
          />
        </button>
        <button
          onClick={onNextSentence}
          className="p-4 text-white/90 hover:text-white transition-colors active:scale-90"
        >
          <Icon name="skip_next" filled size={36} />
        </button>
      </div>

      {/* Row 3: Volume Slider */}
      <div className="flex items-center gap-3 px-4">
        <Icon name="volume_down" size={20} className="text-white/60" />
        <div
          onClick={handleVolumeClick}
          className="relative flex-1 h-1 bg-white/10 rounded-full cursor-pointer"
        >
          <div
            className="absolute top-0 left-0 h-full bg-white/80 rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
          <div
            className="absolute top-1/2 w-2 h-2 bg-white rounded-full shadow-sm"
            style={{ left: `${volume * 100}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>
        <Icon name="volume_up" size={20} className="text-white/60" />
      </div>

      {/* Row 4: Utility Toolbar (Floating Capsule) */}
      <div className="mt-2 px-4">
        <div
          className="h-14 w-full max-w-[400px] mx-auto rounded-full flex items-center justify-between px-6 shadow-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className={`font-bold text-sm ${playbackSpeed === 'slow' ? 'text-[#7bd1fa]' : 'text-white'}`}>
              {playbackSpeed === 'slow' ? '0.75x' : '1x'}
            </span>
          </button>

          {/* Loop Toggle */}
          <button
            onClick={cycleLoopMode}
            className={`p-2 transition-colors active:scale-95 ${
              loopMode !== 'none' ? 'text-[#7bd1fa]' : 'text-white/60 hover:text-[#7bd1fa]'
            }`}
          >
            <Icon
              name={loopMode === 'sentence' ? 'repeat_one' : 'sync'}
              size={24}
            />
          </button>

          {/* Edit Toggle */}
          <button
            onClick={onEditToggle}
            className={`p-2 transition-colors active:scale-95 ${
              isEditMode ? 'text-[#7bd1fa]' : 'text-white/60 hover:text-[#7bd1fa]'
            }`}
          >
            <Icon name={isEditMode ? 'check' : 'edit'} size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
