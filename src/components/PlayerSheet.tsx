import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { TranscriptPanel } from './Player/TranscriptPanel';
import { PlaybackControls } from './Player/PlaybackControls';
import { ImmersiveControls } from './Player/ImmersiveControls';
import { LoopToggle } from './Player/LoopToggle';
import { SpeedToggle } from './Player/SpeedToggle';
import { ModeSwitcher } from './Player/ModeSwitcher';
import { audioEngine } from '../services/audioEngine';
import { mergeSegments, splitSegment, restoreOriginalTranscript } from '../services/storage';
import { useSettingsStore } from '../stores/settingsStore';
import { usePlayerStore } from '../stores/playerStore';
import type { Segment, LoopMode, PlaybackSpeed } from '../types';

interface PlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDictation?: () => void;
}

export function PlayerSheet({ isOpen, onClose, onOpenDictation }: PlayerSheetProps) {
  const { loopMode, playbackSpeed, setLoopMode, setPlaybackSpeed } = useSettingsStore();
  const playerStore = usePlayerStore();
  const { currentAudio, isPlaying, currentTime, currentSegmentIndex } = playerStore;
  const { showToast, ToastComponent } = useToast();

  const [practiceMode, setPracticeMode] = useState<'shadow' | 'dictate'>('shadow');
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying);
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime);
  const [localSegmentIndex, setLocalSegmentIndex] = useState(currentSegmentIndex);
  const [loopSegmentId, setLoopSegmentId] = useState<number | undefined>();
  const [isClosing, setIsClosing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(currentAudio?.isFavorite ?? false);
  const [volume, setVolume] = useState(1);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingMergeSegment, setPendingMergeSegment] = useState<Segment | null>(null);
  const [splitModalSegment, setSplitModalSegment] = useState<Segment | null>(null);
  const [splitHoverIndex, setSplitHoverIndex] = useState<number | null>(null);
  const [localTranscript, setLocalTranscript] = useState<Segment[]>(currentAudio?.transcript ?? []);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  // Sync with playerStore
  useEffect(() => {
    setLocalIsPlaying(isPlaying);
    setLocalCurrentTime(currentTime);
    setLocalSegmentIndex(currentSegmentIndex);
    setIsFavorite(currentAudio?.isFavorite ?? false);
    setLocalTranscript(currentAudio?.transcript ?? []);
  }, [isPlaying, currentTime, currentSegmentIndex, currentAudio]);

  // Setup audio listeners when sheet opens
  useEffect(() => {
    if (!isOpen || !currentAudio) return;

    audioEngine.setOnTimeUpdate((time) => {
      setLocalCurrentTime(time);
      playerStore.setCurrentTime(time);

      if (currentAudio?.transcript) {
        const index = currentAudio.transcript.findIndex(
          (seg) => time >= seg.startTime && time < seg.endTime
        );
        if (index !== -1) {
          setLocalSegmentIndex(index);
          playerStore.setCurrentSegmentIndex(index);
        }
      }
    });

    audioEngine.setOnEnded(() => {
      if (loopMode === 'all') {
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        setLocalIsPlaying(false);
        playerStore.pause();
        playerStore.nextTrack();
      }
    });

    audioEngine.setSpeed(playbackSpeed);
  }, [isOpen, currentAudio, loopMode, playbackSpeed, playerStore]);

  // Sync loopSegmentId when sheet opens and loop was set from MiniPlayer
  useEffect(() => {
    if (!isOpen || !currentAudio?.transcript) return;
    if (loopMode === 'sentence' && loopSegmentId === undefined) {
      const segment = currentAudio.transcript[localSegmentIndex];
      if (segment) {
        setLoopSegmentId(segment.id);
      }
    }
  }, [isOpen, loopMode, loopSegmentId, currentAudio, localSegmentIndex]);

  // Loop mode effect - only manage loop when sheet is open
  useEffect(() => {
    if (!isOpen) return; // Let MiniPlayer manage loop when sheet is closed

    if (loopMode === 'sentence' && loopSegmentId !== undefined && currentAudio?.transcript) {
      const segment = currentAudio.transcript.find((s) => s.id === loopSegmentId);
      if (segment) {
        audioEngine.setLoop(segment.startTime, segment.endTime);
      }
    } else if (loopMode === 'all') {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(true);
    } else if (loopMode === 'none') {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(false);
    }
  }, [isOpen, loopMode, loopSegmentId, currentAudio]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    // Exit edit mode when closing
    setIsEditMode(false);
    setPendingMergeSegment(null);
    setSplitModalSegment(null);
    // Keep loopSegmentId - audioEngine loop should persist while playing

    // Keep playback settings - they sync with MiniPlayer via settingsStore

    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Drag to dismiss handlers
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    currentTranslateY.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null) return;

    const deltaY = clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartY.current === null) return;

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (currentTranslateY.current > 150) {
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(handleClose, 300);
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }

    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [handleClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientY);

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Playback handlers
  const handlePlayPause = useCallback(() => {
    if (localIsPlaying) {
      audioEngine.pause();
      playerStore.pause();
    } else {
      audioEngine.play();
      playerStore.play();
    }
    setLocalIsPlaying(!localIsPlaying);
  }, [localIsPlaying, playerStore]);

  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    setLocalCurrentTime(time);
    playerStore.setCurrentTime(time);
  }, [playerStore]);

  const handleSegmentClick = useCallback((segment: Segment) => {
    if (loopMode === 'sentence') {
      setLoopSegmentId(segment.id);
    }
    if (!localIsPlaying) {
      // Platform-specific handling:
      // - Mobile: Use seekAndPlay (async) to wait for buffer
      // - Desktop: Use seek+play (sync) for zero latency
      if (audioEngine.isMobile()) {
        audioEngine.seekAndPlay(segment.startTime);
      } else {
        audioEngine.seek(segment.startTime);
        audioEngine.play();
      }
      playerStore.play();
      setLocalIsPlaying(true);
    } else {
      // Already playing - just seek
      audioEngine.seek(segment.startTime);
    }
  }, [loopMode, localIsPlaying, playerStore]);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    audioEngine.setSpeed(speed);
  }, [setPlaybackSpeed]);

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  }, []);

  const handleLoopChange = useCallback((mode: LoopMode) => {
    setLoopMode(mode);
    if (mode === 'sentence' && currentAudio?.transcript) {
      setLoopSegmentId(currentAudio.transcript[localSegmentIndex]?.id);
    } else {
      setLoopSegmentId(undefined);
    }
  }, [setLoopMode, currentAudio, localSegmentIndex]);

  const goToPrevSentence = useCallback(() => {
    if (!currentAudio?.transcript || localSegmentIndex <= 0) return;
    const prev = currentAudio.transcript[localSegmentIndex - 1];
    handleSegmentClick(prev);
  }, [currentAudio, localSegmentIndex, handleSegmentClick]);

  const goToNextSentence = useCallback(() => {
    if (!currentAudio?.transcript || localSegmentIndex >= currentAudio.transcript.length - 1) return;
    const next = currentAudio.transcript[localSegmentIndex + 1];
    handleSegmentClick(next);
  }, [currentAudio, localSegmentIndex, handleSegmentClick]);

  const copyTranscript = useCallback(() => {
    if (!currentAudio?.transcript) return;
    const text = currentAudio.transcript.map((s) => s.text).join('\n');
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  }, [currentAudio, showToast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentAudio) return;
    await playerStore.toggleCurrentFavorite();
    setIsFavorite(!isFavorite);
  }, [currentAudio, isFavorite, playerStore]);

  const handleModeChange = useCallback((mode: 'shadow' | 'dictate') => {
    setPracticeMode(mode);

    // Reset loop state when switching modes to prevent stale loop behavior
    if (loopMode === 'sentence') {
      setLoopMode('none');
      setLoopSegmentId(undefined);
      audioEngine.setLoop(null, null);
    }

    if (mode === 'dictate' && onOpenDictation) {
      // Pause audio when switching to dictation
      if (localIsPlaying) {
        audioEngine.pause();
        playerStore.pause();
        setLocalIsPlaying(false);
      }
      onOpenDictation();
      setPracticeMode('shadow'); // Reset for next time
    }
  }, [onOpenDictation, localIsPlaying, playerStore]);

  // Edit Mode handlers
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
      const newEditMode = !prev;
      // Pause audio when entering edit mode
      if (newEditMode && localIsPlaying) {
        audioEngine.pause();
        playerStore.pause();
        setLocalIsPlaying(false);
      }
      return newEditMode;
    });
    setPendingMergeSegment(null);
    setSplitModalSegment(null);
  }, [localIsPlaying, playerStore]);

  const handleEditSegmentClick = useCallback((segment: Segment) => {
    if (!isEditMode || !pendingMergeSegment || !currentAudio) return;

    // Check if clicked segment is adjacent to pendingMergeSegment
    const pendingIndex = localTranscript.findIndex(s => s.id === pendingMergeSegment.id);
    const clickedIndex = localTranscript.findIndex(s => s.id === segment.id);

    if (Math.abs(pendingIndex - clickedIndex) === 1) {
      // Adjacent - perform merge
      const segmentIds = [pendingMergeSegment.id, segment.id];
      mergeSegments(currentAudio.id, segmentIds).then(newTranscript => {
        if (newTranscript) {
          setLocalTranscript(newTranscript);
          playerStore.updateCurrentTranscript(newTranscript);
          showToast('Đã gộp thành công', 'success');
        }
      });
      setPendingMergeSegment(null);
    } else {
      // Not adjacent - show error
      showToast('Chỉ có thể gộp các đoạn nằm cạnh nhau', 'error');
      setPendingMergeSegment(null);
    }
  }, [isEditMode, pendingMergeSegment, currentAudio, localTranscript, playerStore, showToast]);

  const handleMergeStart = useCallback((segment: Segment) => {
    setPendingMergeSegment(segment);
    showToast('Chạm vào đoạn liền kề để gộp', 'info');
  }, [showToast]);

  const handleSplitOpen = useCallback((segment: Segment) => {
    setSplitModalSegment(segment);
  }, []);

  const handleSplitConfirm = useCallback(async (wordIndex: number) => {
    if (!currentAudio || !splitModalSegment) return;
    const newTranscript = await splitSegment(currentAudio.id, splitModalSegment.id, wordIndex);
    if (newTranscript) {
      setLocalTranscript(newTranscript);
      playerStore.updateCurrentTranscript(newTranscript);
      setSplitModalSegment(null);
      showToast('Segment split', 'success');
    }
  }, [currentAudio, splitModalSegment, showToast, playerStore]);

  const handleRestore = useCallback(async () => {
    if (!currentAudio) return;
    const restored = await restoreOriginalTranscript(currentAudio.id);
    if (restored) {
      setLocalTranscript(restored);
      playerStore.updateCurrentTranscript(restored);
      setPendingMergeSegment(null);
      showToast('Transcript restored', 'success');
    } else {
      showToast('No changes to restore', 'info');
    }
  }, [currentAudio, showToast, playerStore]);

  if (!isOpen && !isClosing) return null;
  if (!currentAudio) return null;

  return (
    <div className="fixed inset-0 z-50">
      {ToastComponent}

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bg-[var(--color-surface-container)] flex flex-col
          bottom-0 left-0 right-0 h-[92vh] rounded-t-3xl
          lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-[420px] lg:h-full lg:rounded-t-none lg:rounded-l-3xl
          ${isClosing ? 'sheet-exit lg:sheet-exit-right' : 'sheet-enter lg:sheet-enter-right'}`}
      >
        {/* Drag Handle - mobile only */}
        <div
          className="shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing lg:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-[var(--color-border-gray)] rounded-full mx-auto" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 shrink-0">
          <button onClick={handleClose} className="p-2 -ml-2">
            <Icon name="keyboard_arrow_down" className="text-[var(--color-text-base)]" size={28} />
          </button>
          <h1 className="text-lg font-bold text-[var(--color-text-base)] truncate mx-4 flex-1 text-center">
            {currentAudio.name}
          </h1>
          <button onClick={handleToggleFavorite} className="p-2">
            <Icon
              name="favorite"
              filled={isFavorite}
              className={isFavorite ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-silver)]'}
            />
          </button>
          <button onClick={copyTranscript} className="p-2 -mr-2">
            <Icon name="content_copy" className="text-[var(--color-text-muted)]" />
          </button>
        </header>

        {/* Mode Switcher */}
        <div className="px-4 pt-2">
          <ModeSwitcher mode={practiceMode} onModeChange={handleModeChange} />
        </div>

        {/* Transcript */}
        <TranscriptPanel
          segments={localTranscript}
          currentSegmentIndex={localSegmentIndex}
          loopMode={loopMode}
          loopSegmentId={loopSegmentId}
          onSegmentClick={pendingMergeSegment ? handleEditSegmentClick : handleSegmentClick}
          isEditMode={isEditMode}
          selectedSegments={pendingMergeSegment ? [pendingMergeSegment.id] : []}
          pendingMergeSegmentId={pendingMergeSegment?.id}
          onSplit={handleSplitOpen}
          onMerge={handleMergeStart}
          onCancelMerge={() => setPendingMergeSegment(null)}
        />

        {/* Edit Mode Action Bar */}
        {isEditMode && (
          <div className="shrink-0 px-4 py-3 bg-[var(--color-surface-dark)] border-t border-[var(--color-border-gray)] flex justify-between items-center">
            <button
              onClick={handleRestore}
              className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
            >
              Khôi phục
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              {pendingMergeSegment ? 'Chọn đoạn liền kề để gộp' : 'Chạm vào đoạn để chỉnh sửa'}
            </span>
            <button
              onClick={() => setPendingMergeSegment(null)}
              disabled={!pendingMergeSegment}
              className={`px-4 py-2 text-sm rounded-full ${pendingMergeSegment ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)]'}`}
            >
              Hủy
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="shrink-0 bg-[var(--color-surface-container)]">
          <ImmersiveControls
            isPlaying={localIsPlaying}
            currentTime={localCurrentTime}
            duration={currentAudio.duration}
            volume={volume}
            loopMode={loopMode}
            playbackSpeed={playbackSpeed}
            isEditMode={isEditMode}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onPrevSentence={goToPrevSentence}
            onNextSentence={goToNextSentence}
            onLoopChange={handleLoopChange}
            onSpeedChange={handleSpeedChange}
            onEditToggle={toggleEditMode}
          />
        </div>

        {/* Split Modal */}
        {splitModalSegment && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="bg-[var(--color-surface-container)] rounded-2xl p-4 mx-4 max-w-md w-full max-h-[60vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--color-text-base)] mb-2">Tách đoạn</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Chạm vào từ để tách trước nó</p>
              <div className="flex flex-wrap items-center gap-1 mb-4">
                {splitModalSegment.words.map((word, idx) => (
                  idx === 0 ? (
                    <span
                      key={idx}
                      className="px-2 py-1.5 text-[var(--color-text-muted)] bg-[var(--color-surface-card)] rounded-lg"
                    >
                      {word.text}
                    </span>
                  ) : (
                    <div key={idx} className="flex items-center">
                      {/* Visual cut indicator - red dashed line */}
                      <div
                        className={`w-0.5 h-6 mx-0.5 transition-all ${
                          splitHoverIndex === idx
                            ? 'bg-red-500 border-l-2 border-dashed border-red-500'
                            : 'bg-transparent'
                        }`}
                      />
                      <button
                        onClick={() => handleSplitConfirm(idx)}
                        onMouseEnter={() => setSplitHoverIndex(idx)}
                        onMouseLeave={() => setSplitHoverIndex(null)}
                        onTouchStart={() => setSplitHoverIndex(idx)}
                        onTouchEnd={() => setSplitHoverIndex(null)}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          splitHoverIndex === idx
                            ? 'bg-red-500/30 text-[var(--color-text-base)] ring-2 ring-red-500'
                            : 'text-[var(--color-text-base)] bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/40'
                        }`}
                      >
                        {word.text}
                      </button>
                    </div>
                  )
                ))}
              </div>
              <button
                onClick={() => { setSplitModalSegment(null); setSplitHoverIndex(null); }}
                className="w-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
