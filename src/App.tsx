import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LibraryView } from './components/Library/LibraryView';
import { UploadFlow } from './components/Upload/UploadFlow';
import { SettingsModal } from './components/Settings/SettingsModal';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerSheet } from './components/PlayerSheet';
import { InstallPrompt } from './components/InstallPrompt';
import { SplashScreen } from './components/SplashScreen';
import { usePlayerStore } from './stores/playerStore';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const pendingSheetOpen = usePlayerStore((s) => s.pendingSheetOpen);
  const setPendingSheetOpen = usePlayerStore((s) => s.setPendingSheetOpen);

  // Watch for pending sheet open (from UploadFlow after transcribe)
  useEffect(() => {
    if (pendingSheetOpen) {
      setIsPlayerSheetOpen(true);
      setPendingSheetOpen(false);
    }
  }, [pendingSheetOpen, setPendingSheetOpen]);

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <LibraryView
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPlayerSheet={() => setIsPlayerSheetOpen(true)}
            />
          }
        />
        <Route path="/upload" element={<UploadFlow />} />
      </Routes>

      <MiniPlayer onOpenSheet={() => setIsPlayerSheetOpen(true)} />

      <PlayerSheet
        isOpen={isPlayerSheetOpen}
        onClose={() => setIsPlayerSheetOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <InstallPrompt />

      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
    </BrowserRouter>
  );
}
