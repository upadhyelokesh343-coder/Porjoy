import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, Volume2, VolumeX, Loader2 } from 'lucide-react';

export const TournamentRulesModal = ({ 
  isOpen, 
  onClose, 
  onProceed 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onProceed: () => void 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  useEffect(() => {
    // Stop speech when modal closes or unmounts
    if (!isOpen) {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hindiRulesText = "टूर्नामेंट के जरूरी नियम ध्यान से सुनें। नियम 1: किसी भी प्रकार की हैकिंग या चीटिंग मना है, पकड़े जाने पर अकाउंट बैन होगा और कोई रिफंड नहीं मिलेगा। नियम 2: मैच शुरू होने से पहले रूम आईडी और पासवर्ड से समय पर कस्टम रूम में एंट्री लें। नियम 3: निष्पक्ष खेल का पालन करें। धन्यवाद।";

  const toggleSpeech = async () => {
    if (isPlaying) {
      stopAllAudio();
      return;
    }

    setIsLoadingAudio(true);

    // Strategy 1: High-reliability Google TTS Audio Stream (works 100% in Android APK, WebViews & all browsers)
    try {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hi&q=${encodeURIComponent(hindiRulesText)}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      audio.onerror = () => {
        // Fallback to Web Speech API if Google TTS network fails
        fallbackToWebSpeech();
      };

      await audio.play();
      return;
    } catch (err) {
      fallbackToWebSpeech();
    }
  };

  const fallbackToWebSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(hindiRulesText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      // Keep reference to prevent GC in Chromium WebViews
      (window as any)._activeRulesUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl w-full max-w-md space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
            <span>Rules & Guidelines</span>
          </h2>
          <button 
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }} 
            className="text-neutral-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 p-2 rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Rules Container */}
        <div className="bg-neutral-950 p-3 sm:p-4 rounded-xl border border-neutral-800 space-y-3.5 overflow-y-auto flex-1 min-h-0">
          {/* Audio Player Bar */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">नियम ध्यान से पढ़ें या सुनें</span>
            <button 
              type="button"
              onClick={toggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
                isPlaying 
                  ? 'bg-orange-500 text-neutral-950 shadow-orange-500/20 animate-pulse' 
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isLoadingAudio ? 'लोड हो रहा है...' : isPlaying ? 'आवाज़ बंद करें' : '🔊 नियम सुनें (Hindi)'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-neutral-300">
            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span>🚫</span> 1. No Hacking / Scripts (हैकिंग मना है)
              </h4>
              <p className="text-[11.5px] leading-relaxed text-neutral-400">
                अगर कोई भी प्लेयर हैक, स्क्रिप्ट या चीट्स का इस्तेमाल करते पकड़ा गया तो उसका अकाउंट <span className="text-red-400 font-bold">हमेशा के लिए बैन</span> होगा और कोई फीस रिफंड नहीं होगी।
              </p>
            </div>
            
            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span>⏱️</span> 2. Timely Room Entry (समय पर एंट्री)
              </h4>
              <p className="text-[11.5px] leading-relaxed text-neutral-400">
                मैच शुरू होने से 15 मिनट पहले दिए गए रूम आईडी और पासवर्ड से कस्टम रूम में जुड़ें। मैच शुरू होने के बाद रूम में न आने पर फीस रिफंड नहीं होगी।
              </p>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span>🤝</span> 3. Fair Play (निष्पक्ष खेल)
              </h4>
              <p className="text-[11.5px] leading-relaxed text-neutral-400">
                सभी खिलाड़ी निष्पक्ष और ईमानदारी से खेलें। नियमों का पालन अनिवार्य है।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 shrink-0">
          <button 
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }} 
            className="py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => {
              stopAllAudio();
              onProceed();
            }} 
            className="py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-xs sm:text-sm active:scale-98 cursor-pointer"
          >
            Confirm & Join
          </button>
        </div>
      </div>
    </div>
  );
};
