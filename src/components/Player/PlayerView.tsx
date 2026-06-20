import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { useToast } from '../ui/Toast';
import { TranscriptPanel } from './TranscriptPanel';
import { PlaybackControls } from './PlaybackControls';
import { LoopToggle } from './LoopToggle';
import { SpeedToggle } from './SpeedToggle';
import { audioEngine } from '../../services/audioEngine';
import { getAudio, updateLastPlayed, toggleFavorite } from '../../services/storage';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { AudioRecord, Segment, LoopMode, PlaybackSpeed } from '../../types';

export function PlayerView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { loopMode, playbackSpeed, setLoopMode, setPlaybackSpeed } = useSettingsStore();
  const playerStore = usePlayerStore();
  const { showToast, ToastComponent } = useToast();

  const [audio, setAudio] = useState<AudioRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [loopSegmentId, setLoopSegmentId] = useState<number | undefined>();

  // Track if audio came from playerStore (MiniPlayer) - don't destroy on unmount
  const fromPlayerStoreRef = useRef(false);
  // Track latest state for restoring to playerStore on unmount
  const latestStateRef = useRef({ isPlaying: false, currentTime: 0, currentSegmentIndex: 0 });

  // Load audio
  useEffect(() => {
    if (!id) return;

    // Check if same audio is already playing in playerStore
    const isAlreadyPlaying = playerStore.currentAudio?.id === id;

    async function load() {
      if (isAlreadyPlaying && playerStore.currentAudio) {
        // Use existing audio from playerStore - don't reload
        fromPlayerStoreRef.current = true;
        setAudio(playerStore.currentAudio);
        setIsPlaying(playerStore.isPlaying);
        setCurrentTime(playerStore.currentTime);
        setCurrentSegmentIndex(playerStore.currentSegmentIndex);
        // Clear playerStore state so MiniPlayer hides, but DON'T destroy audio
        playerStore.clearState();
        return;
      }

      // Load fresh audio
      fromPlayerStoreRef.current = false;

      const record = await getAudio(id!);
      if (!record) {
        navigate('/');
        return;
      }
      setAudio(record);
      await audioEngine.load(record.blob);
      audioEngine.setSpeed(playbackSpeed);
      updateLastPlayed(id!);
    }

    load();

    return () => {
      // Only destroy if we loaded fresh audio, not from playerStore
      if (!fromPlayerStoreRef.current) {
        audioEngine.destroy();
      }
    };
  }, [id, navigate, playbackSpeed]);

  // Restore state to playerStore when leaving (for MiniPlayer to show)
  useEffect(() => {
    return () => {
      if (fromPlayerStoreRef.current && audio) {
        const { isPlaying, currentTime, currentSegmentIndex } = latestStateRef.current;
        playerStore.restoreState(audio, isPlaying, currentTime, currentSegmentIndex);
      }
    };
  }, [audio, playerStore]);

  // Keep latestStateRef updated for cleanup
  useEffect(() => {
    latestStateRef.current = { isPlaying, currentTime, currentSegmentIndex };
  }, [isPlaying, currentTime, currentSegmentIndex]);

  // Time update handler
  useEffect(() => {
    audioEngine.setOnTimeUpdate((time) => {
      setCurrentTime(time);
      if (audio?.transcript) {
        const index = audio.transcript.findIndex(
          (seg) => time >= seg.startTime && time < seg.endTime
        );
        if (index !== -1) setCurrentSegmentIndex(index);
      }
    });

    audioEngine.setOnEnded(() => {
      if (loopMode === 'all') {
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        setIsPlaying(false);
      }
    });
  }, [audio, loopMode]);

  // Loop mode effect
  useEffect(() => {
    if (loopMode === 'sentence' && loopSegmentId !== undefined && audio?.transcript) {
      const segment = audio.transcript.find((s) => s.id === loopSegmentId);
      if (segment) {
        audioEngine.setLoop(segment.startTime, segment.endTime);
      }
    } else if (loopMode === 'all') {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(true);
    } else {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(false);
    }
  }, [loopMode, loopSegmentId, audio]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    setCurrentTime(time);
  }, []);

  const handleSegmentClick = useCallback((segment: Segment) => {
    audioEngine.seek(segment.startTime);
    if (loopMode === 'sentence') {
      setLoopSegmentId(segment.id);
    }
    if (!isPlaying) {
      audioEngine.play();
      setIsPlaying(true);
    }
  }, [loopMode, isPlaying]);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    audioEngine.setSpeed(speed);
  }, [setPlaybackSpeed]);

  const handleLoopChange = useCallback((mode: LoopMode) => {
    setLoopMode(mode);
    if (mode === 'sentence' && audio?.transcript) {
      setLoopSegmentId(audio.transcript[currentSegmentIndex]?.id);
    } else {
      setLoopSegmentId(undefined);
    }
  }, [setLoopMode, audio, currentSegmentIndex]);

  const goToPrevSentence = useCallback(() => {
    if (!audio?.transcript || currentSegmentIndex <= 0) return;
    const prev = audio.transcript[currentSegmentIndex - 1];
    handleSegmentClick(prev);
  }, [audio, currentSegmentIndex, handleSegmentClick]);

  const goToNextSentence = useCallback(() => {
    if (!audio?.transcript || currentSegmentIndex >= audio.transcript.length - 1) return;
    const next = audio.transcript[currentSegmentIndex + 1];
    handleSegmentClick(next);
  }, [audio, currentSegmentIndex, handleSegmentClick]);

  const copyTranscript = useCallback(() => {
    if (!audio?.transcript) return;
    const text = audio.transcript.map((s) => s.text).join('\n');
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  }, [audio, showToast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!audio) return;
    const newValue = await toggleFavorite(audio.id);
    setAudio({ ...audio, isFavorite: newValue });
  }, [audio]);

  if (!audio) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)]">
      {ToastComponent}
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <Icon name="arrow_back" className="text-[var(--color-text-base)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-text-base)] truncate mx-4 flex-1 text-center">
          {audio.name}
        </h1>
        <button onClick={handleToggleFavorite} className="p-2">
          <Icon
            name="favorite"
            filled={audio.isFavorite}
            className={audio.isFavorite ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-silver)]'}
          />
        </button>
        <button onClick={copyTranscript} className="p-2 -mr-2">
          <Icon name="content_copy" className="text-[var(--color-text-muted)]" />
        </button>
      </header>

      {/* Transcript */}
      <TranscriptPanel
        segments={audio.transcript}
        currentSegmentIndex={currentSegmentIndex}
        loopMode={loopMode}
        loopSegmentId={loopSegmentId}
        onSegmentClick={handleSegmentClick}
      />

      {/* Controls */}
      <div className="shrink-0 px-4 pb-6 pt-4 bg-[var(--color-surface-container)]">
        <div className="flex justify-center gap-4 mb-4">
          <LoopToggle mode={loopMode} onChange={handleLoopChange} />
          <SpeedToggle speed={playbackSpeed} onChange={handleSpeedChange} />
        </div>
        <PlaybackControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audio.duration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onPrevSentence={goToPrevSentence}
          onNextSentence={goToNextSentence}
        />
      </div>
    </div>
  );
}
