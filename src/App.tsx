import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LibraryView } from './components/Library/LibraryView';
import { UploadFlow } from './components/Upload/UploadFlow';
import { SettingsModal } from './components/Settings/SettingsModal';
import { MiniPlayer } from './components/MiniPlayer';
import { PlayerSheet } from './components/PlayerSheet';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);

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
    </BrowserRouter>
  );
}
