import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowRight, Sparkles, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Google Drive APK File URL
export const APK_DOWNLOAD_URL = 'https://drive.google.com/file/d/101cISWqBpuGVlmLbFkGhKT1rGbtPGp2y/view?usp=drivesdk';

/**
 * Detects if the current user session is running inside the Android APK WebView,
 * an installed PWA (standalone mode), or a native app container.
 * When true, all "Download App" buttons and promotional cards will be completely hidden.
 */
export function isAppOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Clear any previous stale storage keys if present
    if (localStorage.getItem('projoy_is_apk')) {
      localStorage.removeItem('projoy_is_apk');
    }

    // 1. Explicit URL parameter from APK wrapper (e.g. ?isApp=true or ?source=apk)
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get('isApp') === 'true' || 
      urlParams.get('source') === 'apk' || 
      urlParams.get('apk') === 'true'
    ) {
      sessionStorage.setItem('projoy_session_is_apk', 'true');
      return true;
    }
    if (sessionStorage.getItem('projoy_session_is_apk') === 'true') {
      return true;
    }

    // 2. Standalone display mode (PWA installed on device or Android TWA)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // 3. iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // 4. Injected Android Native interface in WebView / APK builders
    if (
      (window as any).Android !== undefined || 
      (window as any).AndroidInterface !== undefined || 
      (window as any).isNativeApp === true ||
      (window as any).Capacitor !== undefined ||
      (window as any).cordova !== undefined
    ) {
      return true;
    }

    // 5. Android WebView signature: Android user agent containing '; wv'
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua) && /;\s*wv\b/i.test(ua)) {
      return true;
    }

    // 6. Android app referrer (when opened directly from APK intent)
    if (document.referrer && document.referrer.startsWith('android-app://')) {
      return true;
    }
  } catch (e) {
    // fallback
  }

  return false;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const downloadProJoyApk = () => {
  const url = APK_DOWNLOAD_URL;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Reusable Hook to access PWA deferred prompt
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (window as any).deferredPrompt || null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const customHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDeferredPrompt(customEvent.detail);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-available', customHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-available', customHandler);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
          setIsInstalled(true);
          setIsModalOpen(false);
          return;
        }
      } catch (err) {
        console.error('Error during PWA installation:', err);
      }
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    isModalOpen,
    setIsModalOpen,
    triggerInstall,
    downloadApk: downloadProJoyApk,
  };
}

// All-in-One Download & WAP Modal opened by the single Download button
export function AppDownloadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { triggerInstall, deferredPrompt } = usePwaInstall();
  const [showWapGuide, setShowWapGuide] = useState(false);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleWapClick = async () => {
    if (deferredPrompt) {
      await triggerInstall();
    } else {
      setShowWapGuide(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 -z-10 cursor-pointer" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-white space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                  <img src="/logo.jpg" alt="ProJoy App" className="w-full h-full object-cover rounded-[14px]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">Download ProJoy App</h3>
                  <p className="text-xs text-neutral-400">Choose your preferred download option</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Direct Android APK Download */}
            <div className="bg-neutral-950/80 border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">Android APK File</h4>
                    <p className="text-[11px] text-neutral-400">Full native app • 60 FPS • Real-time alerts</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full shrink-0">
                  Recommended
                </span>
              </div>

              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onClose();
                }}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download APK File Now</span>
              </a>
            </div>

            {/* Option 2: Website Web App (WAP / Add to Home Screen) */}
            <div className="bg-neutral-950/80 border border-neutral-800 hover:border-teal-500/40 rounded-2xl p-4 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">Website Web App (WAP)</h4>
                    <p className="text-[11px] text-neutral-400">Bina file download kiye seedha mobile screen par add karein</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] font-bold rounded-full shrink-0">
                  All Phones
                </span>
              </div>

              <button
                type="button"
                onClick={handleWapClick}
                className="w-full py-2.5 sm:py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs sm:text-sm border border-neutral-700 hover:border-neutral-600 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Install as Web App (WAP)</span>
              </button>

              {/* Instructions drawer if prompt not directly supported */}
              {showWapGuide && (
                <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-300 space-y-1.5 animate-in fade-in">
                  <p className="font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>{isIOS ? 'iPhone Safari mein add karein:' : 'Android Chrome mein add karein:'}</span>
                  </p>
                  {isIOS ? (
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Safari ke bottom bar mein <strong>Share Button (⎋)</strong> dabayein aur <strong>"Add to Home Screen"</strong> chunein.
                    </p>
                  ) : (
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Chrome browser ke upar <strong>3 Dots (⋮)</strong> par click karke <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> chunein.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Safe, Secure & Verified ProJoy Esports</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Single Dedicated Home Page Download Card with EXACTLY ONE primary button
export function HomeAppDownloadCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAppEnv, setIsAppEnv] = useState<boolean>(() => isAppOrStandalone());

  useEffect(() => {
    setIsAppEnv(isAppOrStandalone());
  }, []);

  // Jab app APK ke andar open ho ya installed standalone mode me ho, to Download Card nahi dikhega
  if (isAppEnv) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl transition-all group">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <img src="/logo.jpg" alt="ProJoy App" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  ProJoy Official Mobile App
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Low ping, instant match room IDs, 60FPS gaming & fastest deposit/withdrawal!
              </p>
            </div>
          </div>

          {/* EXACTLY ONE Download Button on Home Page */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 text-xs sm:text-sm font-black rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download App</span>
          </button>
        </div>
      </div>

      <AppDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// Keep default export as null component for backward compatibility
export default function InstallPWA() {
  return null;
}
