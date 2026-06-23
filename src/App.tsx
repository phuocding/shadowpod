import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LibraryView } from './components/Library/LibraryView';
import { UploadFlow } from './components/Upload/UploadFlow';
import { SettingsModal } from './components/Settings/SettingsModal';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerSheet } from './components/PlayerSheet';
import { InstallPrompt } from './components/InstallPrompt';
import { SplashScreen } from './components/SplashScreen';
import { DictationView } from './components/Dictation';
import { usePlayerStore } from './stores/playerStore';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);
  const [isDictationOpen, setIsDictationOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const currentAudio = usePlayerStore((s) => s.currentAudio);
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
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  const handleOpenDictation = () => {
    setIsPlayerSheetOpen(false);
    setIsDictationOpen(true);
  };

  const handleCloseDictation = () => {
    setIsDictationOpen(false);
    setIsPlayerSheetOpen(true);
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
        onOpenDictation={handleOpenDictation}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <InstallPrompt />

      {isDictationOpen && currentAudio && (
        <DictationView
          audio={currentAudio}
          onClose={handleCloseDictation}
        />
      )}

      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
    </BrowserRouter>
  );
}
