import { Icon } from '../ui/Icon';

interface DesktopSidebarProps {
  currentTab: 'home' | 'favorites';
  onTabChange: (tab: 'home' | 'favorites') => void;
  onOpenSettings: () => void;
  onUpload: () => void;
}

export function DesktopSidebar({
  currentTab,
  onTabChange,
  onOpenSettings,
  onUpload,
}: DesktopSidebarProps) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-[var(--color-surface-container-lowest)] border-r border-white/5 flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/screen.png" alt="ShadowPod" className="w-10 h-10" />
        <span className="text-xl font-bold text-[var(--color-primary)] tracking-tight">
          ShadowPod
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {/* Home */}
          <li>
            <button
              onClick={() => onTabChange('home')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentTab === 'home'
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-base)]'
              }`}
            >
              <Icon name="home" filled={currentTab === 'home'} size={24} />
              <span className="font-medium">Home</span>
            </button>
          </li>

          {/* Favorites */}
          <li>
            <button
              onClick={() => onTabChange('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentTab === 'favorites'
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-base)]'
              }`}
            >
              <Icon name="favorite" filled={currentTab === 'favorites'} size={24} />
              <span className="font-medium">Favorites</span>
            </button>
          </li>

          {/* Upload - Accent button */}
          <li className="pt-4">
            <button
              onClick={onUpload}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)] transition-colors"
            >
              <Icon name="add" size={24} />
              <span className="font-medium">Upload Audio</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Bottom section - Settings */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text-base)] transition-colors"
        >
          <Icon name="settings" size={24} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
