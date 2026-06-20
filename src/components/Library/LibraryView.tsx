import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAudio, deleteAudio, toggleFavorite } from '../../services/storage';
import type { AudioRecord } from '../../types';
import { Icon } from '../ui/Icon';
import { AudioCard } from './AudioCard';
import { EmptyState } from './EmptyState';

interface LibraryViewProps {
  onOpenSettings: () => void;
  onOpenPlayerSheet: () => void;
}

export function LibraryView({ onOpenSettings, onOpenPlayerSheet }: LibraryViewProps) {
  const navigate = useNavigate();
  const [audioList, setAudioList] = useState<AudioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredList = searchQuery
    ? audioList.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : audioList;

  useEffect(() => {
    loadAudioList();
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

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      {/* Header - gradient fade */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-4 bg-gradient-to-b from-[var(--color-background)] to-transparent">
        <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight">ShadowPod</h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full w-10 h-10 flex items-center justify-center transition-transform active:scale-95"
        >
          <Icon name="add" />
        </button>
      </header>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-[var(--color-background)]">
          <div className="relative">
            <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audio..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-dark)] border border-[var(--color-border-gray)] rounded-xl text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 pt-2 pb-40 max-w-2xl mx-auto w-full">
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

      {/* Bottom Nav - Liquid Glass iOS 26 Style */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50 bg-[var(--color-surface-container-low)]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex justify-around items-center h-16 px-4">
          <button
            onClick={() => setShowSearch(false)}
            className={`flex flex-col items-center justify-center ${!showSearch ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} transition-colors`}
          >
            <Icon name="library_music" filled={!showSearch} size={24} />
            <span className="text-xs mt-1">Library</span>
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className={`flex flex-col items-center justify-center ${showSearch ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} transition-colors`}
          >
            <Icon name="search" filled={showSearch} size={24} />
            <span className="text-xs mt-1">Search</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center text-[var(--color-text-muted)] transition-colors"
          >
            <Icon name="settings" size={24} />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </nav>
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
