import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'sp_install_dismissed';

export const InstallPromptBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-xl bg-[#1a2744] px-4 py-3 shadow-lg border border-[#c9a84c]/20">
        <span className="text-sm text-white flex-1">
          📱 Add Survivor Packet to your home screen for quick access
        </span>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-[#c9a84c] px-3 py-1.5 text-xs font-semibold text-[#1a2744] hover:bg-[#d4b05c] transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
