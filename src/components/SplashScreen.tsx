import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [loadingText, setLoadingText] = useState('INITIALIZING');
  const [isExiting, setIsExiting] = useState(false);

  const loadingMessages = [
    'SYNCING FREQUENCIES',
    'CALIBRATING ACOUSTICS',
    'LOADING VOICES',
    'MASTERING AUDIO',
  ];

  useEffect(() => {
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex++;
      if (messageIndex < loadingMessages.length) {
        setLoadingText(loadingMessages[messageIndex]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(onFinish, 500);
        }, 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[200] bg-[var(--color-background)] flex items-center justify-center transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-between h-full py-16 px-4 w-full max-w-lg mx-auto animate-fade-in-up">
        <div className="h-16 w-full" />

        {/* Center Brand */}
        <div className="flex flex-col items-center text-center">
          {/* Animated Logo */}
          <div className="logo-pulse mb-8 w-48 h-48 flex items-center justify-center">
            <AnimatedLogo />
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight mb-2">
            ShadowPod
          </h1>
        </div>

        {/* Bottom Loading */}
        <div className="w-full flex flex-col items-center space-y-12">
          {/* Progress Bar */}
          <div className="w-full max-w-xs space-y-3">
            <div className="h-1 w-full bg-[var(--color-surface-container)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary)] loading-bar-fill shadow-[0_0_8px_rgba(76,244,121,0.5)]" />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-[var(--color-text-muted)] transition-opacity">
                {loadingText}
              </span>
              <span className="text-[10px] text-[var(--color-primary)]">ENHANCING</span>
            </div>
          </div>

          {/* Tagline */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-[var(--color-text-silver)] tracking-widest uppercase opacity-70">
              Listen. Learn. Master.
            </p>
            <p className="text-xs text-[var(--color-primary)] opacity-80">
              Free forever • No subscriptions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function AnimatedLogo() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <style>
        {`
          .groove { transform-origin: center; animation: rotate 10s linear infinite; }
          .pulse { transform-origin: center; animation: pulse 2s ease-in-out infinite; }
          .text-spiral { transform-origin: center; animation: rotate 15s linear infinite; }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
        `}
      </style>
      <circle className="groove" cx="100" cy="100" r="85" stroke="#1ed760" strokeWidth="2" strokeDasharray="1 4" opacity="0.3" fill="none" />
      <circle className="groove" cx="100" cy="100" r="65" stroke="#1ed760" strokeWidth="4" opacity="0.6" fill="none" style={{ animationDirection: 'reverse' }} />
      <circle className="pulse" cx="100" cy="100" r="25" fill="#1ed760" />
      <path d="M145 100C145 124.853 124.853 145 100 145" stroke="#1ed760" strokeWidth="10" strokeLinecap="round" fill="none">
        <animate attributeName="stroke-dasharray" from="0 100" to="100 0" dur="2s" fill="freeze" />
      </path>
      <path d="M100 55V80M118 60L106 72" stroke="#1ed760" strokeWidth="8" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="10 100 100" dur="1s" repeatCount="indefinite" additive="sum" />
      </path>
      <text x="145" y="105" fill="#1ed760" fontSize="24" fontWeight="bold" fontFamily="'Be Vietnam Pro', sans-serif" className="text-spiral">S</text>
    </svg>
  );
}
