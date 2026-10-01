import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Bell, Volume2, VolumeX, MessageSquare, ArrowRight, DollarSign, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToast {
  id: string;
  type: 'deposit' | 'withdrawal' | 'message' | 'general';
  title: string;
  description: string;
  timestamp: Date;
  actionUrl?: string;
  amount?: number;
}

// Synthesize pleasant musical notification sound using Web Audio API (100% offline & APK compatible)
const playChimeSound = (type: 'deposit' | 'withdrawal' | 'message') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Notes for different alert types
    let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Pleasant rich chime for deposit)
    if (type === 'withdrawal') {
      notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5
    } else if (type === 'message') {
      notes = [659.25, 783.99, 987.77]; // E5, G5, B5 (Friendly ping)
    }

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.38);
    });

    // Mobile Phone Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (e) {
    console.warn("Could not synthesize audio alert:", e);
  }
};

export const AdminNotifier = () => {
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('projoy_admin_sound') !== 'false';
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  const lastTxIdRef = useRef<Set<string>>(new Set());
  const lastMsgIdRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Request native browser push notification permission
  const requestPushPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
      if (permission === 'granted') {
        new Notification("ProJoy Admin Alerts Active", {
          body: "You will now receive real-time notifications for user deposits, payouts, and chat messages.",
          icon: "/logo.jpg"
        });
      }
    } catch (e) {
      console.warn("Notification permission error:", e);
    }
  };

  const triggerAlert = (toast: NotificationToast) => {
    // 1. Add to in-app toast stack
    setToasts(prev => [toast, ...prev.slice(0, 4)]);

    // 2. Play Audio Chime
    if (soundEnabled) {
      playChimeSound(toast.type as any);
    }

    // 3. Native Push Notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(toast.title, {
          body: toast.description,
          icon: '/logo.jpg',
          badge: '/logo.jpg'
        });
      } catch (e) {
        // ignore
      }
    }

    // Auto-dismiss in-app toast after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 6500);
  };

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;

    // 1. Listen for Real-Time Transactions (Deposits and Withdrawals)
    const txRef = collection(db, 'transactions');
    const txQuery = query(txRef, orderBy('date', 'desc'), limit(15));

    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      if (!initialLoadDone.current) {
        snapshot.forEach(doc => lastTxIdRef.current.add(doc.id));
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (!lastTxIdRef.current.has(docId)) {
            lastTxIdRef.current.add(docId);
            const data = change.doc.data();
            const isDeposit = data.type === 'deposit';
            const isPending = data.status === 'pending';

            if (isPending) {
              triggerAlert({
                id: 'tx_' + docId + '_' + Date.now(),
                type: isDeposit ? 'deposit' : 'withdrawal',
                title: isDeposit ? `💰 New Deposit Request: ₹${data.paymentAmount || data.amount}` : `⚡ New Withdrawal Request: ₹${data.amount}`,
                description: isDeposit
                  ? `UTR: ${data.utr || 'Pending'} • Reference: ${data.reference || docId}`
                  : `Payout requested via ${data.transferType || 'UPI'}`,
                timestamp: new Date(),
                actionUrl: '/admin',
                amount: data.paymentAmount || data.amount
              });
            }
          }
        }
      });
    }, (err) => {
      console.warn("Tx listener error:", err);
    });

    // 2. Listen for Real-Time Support Messages from Users
    const msgRef = collection(db, 'messages');
    const msgQuery = query(msgRef, orderBy('timestamp', 'desc'), limit(10));

    const unsubMsg = onSnapshot(msgQuery, (snapshot) => {
      if (!initialLoadDone.current) {
        snapshot.forEach(doc => lastMsgIdRef.current.add(doc.id));
        initialLoadDone.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (!lastMsgIdRef.current.has(docId)) {
            lastMsgIdRef.current.add(docId);
            const data = change.doc.data();
            // Only alert if message is from a user to admin (not sent by admin)
            if (data.senderId !== 'admin') {
              triggerAlert({
                id: 'msg_' + docId + '_' + Date.now(),
                type: 'message',
                title: `💬 Support Message: ${data.senderName || 'Player'}`,
                description: data.text ? (data.text.length > 60 ? data.text.slice(0, 60) + '...' : data.text) : 'Sent a new message',
                timestamp: new Date(),
                actionUrl: '/admin'
              });
            }
          }
        }
      });
    }, (err) => {
      console.warn("Msg listener error:", err);
    });

    return () => {
      unsubTx();
      unsubMsg();
    };
  }, [currentUser, soundEnabled]);

  if (currentUser?.role !== 'admin') return null;

  return (
    <>
      {/* Floating In-App Toast Banner Stack (Top Center / Top Right) */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`p-4 rounded-2xl shadow-2xl border pointer-events-auto backdrop-blur-xl relative overflow-hidden cursor-pointer ${
                t.type === 'deposit'
                  ? 'bg-neutral-900/95 border-emerald-500/40 text-white shadow-emerald-500/10'
                  : t.type === 'withdrawal'
                  ? 'bg-neutral-900/95 border-blue-500/40 text-white shadow-blue-500/10'
                  : 'bg-neutral-900/95 border-purple-500/40 text-white shadow-purple-500/10'
              }`}
              onClick={() => {
                if (t.actionUrl) navigate(t.actionUrl);
                setToasts(prev => prev.filter(item => item.id !== t.id));
              }}
            >
              {/* Left Color Accent Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                t.type === 'deposit' ? 'bg-emerald-500' : t.type === 'withdrawal' ? 'bg-blue-500' : 'bg-purple-500'
              }`} />

              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    t.type === 'deposit' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : t.type === 'withdrawal' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {t.type === 'deposit' ? (
                      <DollarSign className="w-5 h-5" />
                    ) : t.type === 'withdrawal' ? (
                      <Bell className="w-5 h-5 animate-bounce" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug line-clamp-2">
                      {t.description}
                    </p>
                    <span className="text-[9px] text-neutral-400 font-mono mt-1 block">
                      Just now • Click to Open Admin
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToasts(prev => prev.filter(item => item.id !== t.id));
                  }}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Admin Quick Controls (Sound Toggle & Push Permission) */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2 items-end">
        {!hasNotificationPermission && typeof Notification !== 'undefined' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={requestPushPermission}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 border border-purple-400/30 active:scale-95 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 animate-pulse" />
            <span>Enable Push Alerts</span>
          </motion.button>
        )}

        <button
          type="button"
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            localStorage.setItem('projoy_admin_sound', next.toString());
            if (next) playChimeSound('deposit');
          }}
          className={`p-2.5 rounded-xl border shadow-lg transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer ${
            soundEnabled
              ? 'bg-neutral-900/90 text-emerald-400 border-emerald-500/40 hover:bg-neutral-800'
              : 'bg-neutral-900/90 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
          }`}
          title={soundEnabled ? "Admin Sound Alerts ON" : "Admin Sound Alerts OFF"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Alerts ON' : 'Alerts Muted'}</span>
        </button>
      </div>
    </>
  );
};
