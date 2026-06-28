import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAudio, deleteAudio, toggleFavorite } from '../../services/storage';
import type { AudioRecord } from '../../types';
import type { FeaturedAudio } from '../../types/featured';
import { Icon } from '../ui/Icon';
import { AudioCard } from './AudioCard';
import { EmptyState } from './EmptyState';
import { FeaturedSection } from '../Featured';
import { WelcomeScreen, UploadPrompt, UploadGuideModal } from '../Onboarding';
import { SearchView } from '../SearchView';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { usePlayerStore } from '../../stores/playerStore';

interface LibraryViewProps {
  onOpenSettings: () => void;
  onOpenPlayerSheet: () => void;
}

export function LibraryView({ onOpenSettings, onOpenPlayerSheet }: LibraryViewProps) {
  const navigate = useNavigate();
  const [audioList, setAudioList] = useState<AudioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearchView, setShowSearchView] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'favorites'>('home');

  // Onboarding state
  const {
    hasSeenWelcome,
    sampleSessionsCompleted,
    hasSeenUploadPrompt,
    setWelcomeSeen,
    setUploadPromptSeen,
  } = useOnboardingStore();
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);

  // Player store for featured audio
  const loadFeaturedAudio = usePlayerStore((s) => s.loadFeaturedAudio);
  const openSheet = usePlayerStore((s) => s.openSheet);

  const filteredList = audioList.filter((a) => {
    const matchesTab = currentTab === 'home' || a.isFavorite;
    return matchesTab;
  });

  useEffect(() => {
    loadAudioList();
  }, []);

  // Listen for favorite changes from PlayerSheet
  useEffect(() => {
    const handleFavoriteChanged = (e: CustomEvent<{ id: string; isFavorite: boolean }>) => {
      setAudioList((prev) =>
        prev.map((a) => (a.id === e.detail.id ? { ...a, isFavorite: e.detail.isFavorite } : a))
      );
    };
    window.addEventListener('favorite-changed', handleFavoriteChanged as EventListener);
    return () => window.removeEventListener('favorite-changed', handleFavoriteChanged as EventListener);
  }, []);

  async function loadAudioList() {
    setIsLoading(true);
    const list = await getAllAudio();
    setAudioList(list);
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm('Xóa audio này?')) {
      await deleteAudio(id);
      setAudioList((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleToggleFavorite(id: string) {
    const newValue = await toggleFavorite(id);
    setAudioList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorite: newValue } : a))
    );
  }

  // Handle featured audio selection
  function handleSelectFeatured(audio: FeaturedAudio) {
    loadFeaturedAudio(audio);
    openSheet();
  }

  // Show upload prompt after 2 sample sessions
  useEffect(() => {
    if (
      sampleSessionsCompleted >= 2 &&
      !hasSeenUploadPrompt &&
      audioList.length === 0
    ) {
      const timer = setTimeout(() => setShowUploadPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [sampleSessionsCompleted, hasSeenUploadPrompt, audioList.length]);

  // Welcome screen for first-time users
  if (!hasSeenWelcome && audioList.length === 0 && !isLoading) {
    return (
      <WelcomeScreen
        onTrySample={() => setWelcomeSeen()}
        onUploadOwn={() => {
          setWelcomeSeen();
          navigate('/upload');
        }}
        onSkip={() => setWelcomeSeen()}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      {/* Header - Logo + Search */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-[var(--color-background)] to-transparent">
        <div className="flex items-center gap-2">
          <img src="/screen.png" alt="ShadowPod" className="w-8 h-8" />
          <span className="text-xl font-bold text-[var(--color-primary)] tracking-tight">ShadowPod</span>
        </div>
        <button
          onClick={() => setShowSearchView(true)}
          className="rounded-full w-10 h-10 flex items-center justify-center transition-all active:scale-95 bg-[var(--color-surface-container)] text-[var(--color-text-base)]"
        >
          <Icon name="search" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-2 pb-40 max-w-2xl mx-auto w-full">
        {/* Featured Section - Always visible on Home tab */}
        {currentTab === 'home' && (
          <FeaturedSection onSelectAudio={handleSelectFeatured} />
        )}

        {/* Your Library Section */}
        {currentTab === 'home' && audioList.length > 0 && (
          <h2 className="text-lg font-bold text-[var(--color-text-base)] mb-3">
            Your Library
          </h2>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : audioList.length === 0 ? (
          <EmptyState />
        ) : filteredList.length === 0 ? (
          <p className="text-center text-[var(--color-text-muted)] py-8">Không tìm thấy audio</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredList.map((audio) => (
              <AudioCard
                key={audio.id}
                audio={audio}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onOpenSheet={onOpenPlayerSheet}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upload Prompt - After 2 sample sessions */}
      {showUploadPrompt && (
        <UploadPrompt
          onShowGuide={() => {
            setShowUploadPrompt(false);
            setShowUploadGuide(true);
          }}
          onDismiss={() => {
            setShowUploadPrompt(false);
            setUploadPromptSeen();
          }}
        />
      )}

      {/* Upload Guide Modal */}
      <UploadGuideModal
        isOpen={showUploadGuide}
        onClose={() => setShowUploadGuide(false)}
        onUploadNow={() => {
          setShowUploadGuide(false);
          navigate('/upload');
        }}
      />

      {/* Bottom Nav - Threads Style */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50 bg-[var(--color-surface-container-low)]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Home */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center p-2 transition-colors ${currentTab === 'home' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
          >
            <Icon name="home" filled={currentTab === 'home'} size={24} />
          </button>
          {/* Noti - disabled */}
          <button
            disabled
            className="flex flex-col items-center justify-center p-2 text-[var(--color-text-muted)] opacity-40 cursor-not-allowed"
          >
            <Icon name="notifications" size={24} />
          </button>
          {/* Add - center, bigger */}
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center w-12 h-12 -mt-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full shadow-lg transition-transform active:scale-95"
          >
            <Icon name="add" size={28} />
          </button>
          {/* Favorite */}
          <button
            onClick={() => setCurrentTab('favorites')}
            className={`flex flex-col items-center justify-center p-2 transition-colors ${currentTab === 'favorites' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
          >
            <Icon name="favorite" filled={currentTab === 'favorites'} size={24} />
          </button>
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center p-2 text-[var(--color-text-muted)] transition-colors"
          >
            <Icon name="settings" size={24} />
          </button>
        </div>
      </nav>

      {/* Search View */}
      <SearchView
        isOpen={showSearchView}
        onClose={() => setShowSearchView(false)}
        userAudios={audioList}
        onSelectUserAudio={(audio) => {
          usePlayerStore.getState().loadAndPlay(audio.id);
          onOpenPlayerSheet();
        }}
        onSelectFeaturedAudio={(audio) => {
          handleSelectFeatured(audio);
        }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center bg-[var(--color-surface-dark)] rounded-xl p-4 animate-pulse"
        >
          <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-lg mr-4" />
          <div className="flex-1">
            <div className="h-4 bg-[var(--color-surface-container)] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[var(--color-surface-container)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
