import React, { useState } from "react";
import { useStore } from '../store';
import { User as UserIcon, LogOut, CheckCircle2, Trophy, Gamepad2, MessageSquare, Send, Bell, ExternalLink, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import UserChat from '../components/UserChat';

export default function Profile() {
  const currentUser = useStore(state => state.currentUser);
  const updateProfile = useStore(state => state.updateProfile);
  const logout = useStore(state => state.logout);
  const tournaments = useStore(state => state.tournaments) || [];
  const transactions = useStore(state => state.transactions) || [];
  
  const [name, setName] = useState(currentUser?.name || '');
  const [isSaved, setIsSaved] = useState(false);
  const [view, setView] = useState<'profile' | 'chat'>('profile');

  // Telegram Alert States
  const [telegramChatId, setTelegramChatId] = useState(currentUser?.telegramChatId || '');
  const [customBotToken, setCustomBotToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramAlertMsg, setTelegramAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveTelegram = async () => {
    if (!telegramChatId.trim()) {
      setTelegramAlertMsg({ type: 'error', text: 'Kripya valid Telegram Chat ID daalein!' });
      return;
    }
    setIsSavingTelegram(true);
    setTelegramAlertMsg(null);
    try {
      await updateProfile({ telegramChatId: telegramChatId.trim() });
      
      // Also register to server
      try {
        await fetch('/api/telegram/set-chat-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: telegramChatId.trim() })
        });
      } catch (e) {}

      if (customBotToken.trim()) {
        try {
          await fetch('/api/telegram/set-bot-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botToken: customBotToken.trim() })
          });
        } catch (e) {}
      }

      setTelegramSaved(true);
      setTelegramAlertMsg({ type: 'success', text: 'Telegram Chat ID successfully link ho gaya! Ab aapko turant alert milenge.' });
      setTimeout(() => setTelegramSaved(false), 3000);
    } catch (err: any) {
      setTelegramAlertMsg({ type: 'error', text: err?.message || 'Chat ID save karne me error aayi.' });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegramAlert = async () => {
    const idToSend = telegramChatId.trim() || currentUser.telegramChatId;
    if (!idToSend) {
      setTelegramAlertMsg({ type: 'error', text: 'Pehle Chat ID daal kar Save karein, fir Test Alert bhejein.' });
      return;
    }
    setIsTestingTelegram(true);
    setTelegramAlertMsg(null);
    try {
      // If custom bot token was entered, sync it first
      if (customBotToken.trim()) {
        try {
          await fetch('/api/telegram/set-bot-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botToken: customBotToken.trim() })
          });
        } catch (e) {}
      }

      const res = await fetch('/api/telegram/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: idToSend, userId: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setTelegramAlertMsg({ type: 'success', text: '🚀 Telegram Bot ne aapke chat par live notification bhej diya hai! Apna Telegram app check karein.' });
      } else {
        setTelegramAlertMsg({ type: 'error', text: data.message || 'Notification bhejne me issue aaya. Kripya bot token ya chat ID check karein.' });
      }
    } catch (err: any) {
      setTelegramAlertMsg({ type: 'error', text: 'Bot server se connect nahi ho paya. Kripya thodi der baad try karein.' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const totalPlayed = tournaments.filter(t => t.participants.some(p => p.userId === currentUser.id)).length;
  const totalWon = transactions
    .filter(tx => tx.userId === currentUser.id && tx.type === 'prize' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (view === 'chat') {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col h-screen w-screen overflow-hidden">
        <UserChat 
          userId={currentUser.id} 
          userName={currentUser.name || "Anonymous"} 
          onBack={() => setView('profile')} 
        />
      </div>
    );
  }

  const isTelegramActive = Boolean(currentUser.telegramChatId || telegramChatId);

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="text-center p-6 flex flex-col items-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 20px rgba(16,185,129,0.2)", 
              "0 0 35px rgba(16,185,129,0.4)", 
              "0 0 20px rgba(16,185,129,0.2)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 rounded-full mb-4 overflow-hidden border-4 border-emerald-500/30 bg-neutral-800 relative group"
        >
          <img 
            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${currentUser.id}`} 
            alt="Profile Avatar" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Animated Glow Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10 animate-ping opacity-20"></div>
        </motion.div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">{currentUser.name}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-neutral-400 font-medium">+91 {currentUser.phone}</p>
          </div>
        </div>
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-lg"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">Played</p>
          <p className="text-2xl font-black text-white">{totalPlayed}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-lg"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">Won</p>
          <p className="text-2xl font-black text-emerald-400">₹{totalWon}</p>
        </motion.div>
      </div>

      {/* Message / Support Box */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-neutral-900 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-base">Support & Help</h3>
          <p className="text-xs text-neutral-400">Have questions? Chat live with our admins.</p>
        </div>
        <button
          onClick={() => setView('chat')}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" /> Live Chat
        </button>
      </div>

      {/* TELEGRAM NOTIFICATION CARD */}
      <div className="bg-gradient-to-b from-[#182533] to-[#0e1621] border border-[#2b5278]/40 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Background glow & branding */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#0088cc]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-[#2b5278]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-[#0088cc] shadow-md">
              <Send className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-1.5">
                Telegram Notifications
                <Sparkles className="w-4 h-4 text-[#0088cc] animate-pulse" />
              </h3>
              <p className="text-[11px] text-neutral-300">Payment & Match live alerts seedhe Telegram par</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            isTelegramActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isTelegramActive ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`}></span>
            {isTelegramActive ? 'Active' : 'Offline'}
          </span>
        </div>

        {/* Action Steps Links */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[10px] font-black">1</span>
            Bot Start Karein & ID Nikalein:
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Direct Link to Official Bot */}
            <a
              href="https://t.me/ProJoyAlert_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#17212b] hover:bg-[#202b36] border border-[#2b5278]/50 rounded-xl flex flex-col justify-between group transition-all shadow-sm hover:border-[#0088cc]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-white group-hover:text-[#0088cc] transition-colors">@ProJoyAlert_bot</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0088cc]" />
              </div>
              <span className="text-[10px] text-neutral-400">Bot khol kar <b>/start</b> dabayein</span>
            </a>

            {/* Direct Link to Chat ID Generator Bot */}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#17212b] hover:bg-[#202b36] border border-[#2b5278]/50 rounded-xl flex flex-col justify-between group transition-all shadow-sm hover:border-[#0088cc]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-white group-hover:text-[#0088cc] transition-colors">ID Generator Bot</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#0088cc]" />
              </div>
              <span className="text-[10px] text-neutral-400">Apna <b>Chat ID number</b> yahan se copy karein</span>
            </a>
          </div>
        </div>

        {/* Input for Telegram Chat ID */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[10px] font-black">2</span>
              Apni Telegram Chat ID Yahan Paste Karein:
            </span>
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-[10px] text-[#0088cc] hover:underline flex items-center gap-1"
            >
              {showTokenInput ? 'Hide Bot Token' : '⚙️ Bot Token Change Karein'}
            </button>
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Jaise: 8950581003 ya 123456789"
              className="w-full px-4 py-3 bg-[#0e1621] border border-[#2b5278]/60 rounded-xl text-white font-mono text-sm placeholder:text-neutral-500 focus:border-[#0088cc] outline-none transition-all shadow-inner"
            />
            {telegramChatId && (
              <button
                type="button"
                onClick={() => setTelegramChatId('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Optional Custom Bot Token Input */}
        {showTokenInput && (
          <div className="p-3 bg-[#0b1219] border border-[#2b5278]/40 rounded-xl space-y-2 animate-in fade-in duration-200">
            <label className="block text-[11px] font-bold text-neutral-300">
              Telegram Bot API Token (@BotFather se mila naya token):
            </label>
            <input
              type="text"
              value={customBotToken}
              onChange={(e) => setCustomBotToken(e.target.value)}
              placeholder="8247384148:AA..."
              className="w-full px-3 py-2 bg-[#17212b] border border-neutral-700 rounded-lg text-white font-mono text-xs focus:border-[#0088cc] outline-none"
            />
            <p className="text-[10px] text-neutral-400">
              💡 Agar aapne @BotFather mein bot recreate ya token revoke kiya hai, toh naya token yahan paste karke <b>Save & Enable</b> karein.
            </p>
          </div>
        )}

        {/* Status / Alert Message */}
        {telegramAlertMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            telegramAlertMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {telegramAlertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <p className="leading-relaxed">{telegramAlertMsg.text}</p>
          </div>
        )}

        {/* Action Buttons: Save & Test */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveTelegram}
            disabled={isSavingTelegram}
            className="py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-[#0088cc]/30 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            {isSavingTelegram ? (
              'Saving...'
            ) : telegramSaved ? (
              <><Check className="w-4 h-4" /> Linked!</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Save & Enable</>
            )}
          </button>

          <button
            type="button"
            onClick={handleTestTelegramAlert}
            disabled={isTestingTelegram}
            className="py-3 px-4 bg-[#233140] hover:bg-[#2b3d52] border border-[#2b5278]/70 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 hover:border-[#0088cc]"
          >
            {isTestingTelegram ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <><Bell className="w-4 h-4 text-yellow-400" /> Test Notification</>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 outline-none transition-colors"
            placeholder="Your Name"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {isSaved ? <><CheckCircle2 className="w-5 h-5" /> Saved Successfully</> : 'Save Changes'}
        </button>
      </form>

      <button
        onClick={logout}
        className="w-full py-4 text-red-400 hover:bg-red-400/10 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  );
}
