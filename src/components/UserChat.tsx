import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Message } from '../types';
import { ArrowLeft, Send, MessageSquare, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface UserChatProps {
  userId: string;
  userName: string;
  isAdminMode?: boolean;
  onBack: () => void;
}

export default function UserChat({ userId, userName, isAdminMode = false, onBack }: UserChatProps) {
  const currentUser = useStore(state => state.currentUser);
  const sendMessage = useStore(state => state.sendMessage);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    "💰 Deposit Help",
    "⚡ Withdrawal Status",
    "🏆 Tournament Room ID/Pass",
    "🎁 Bonus & Rewards"
  ];

  // Real-time listener for this specific user's conversation
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore snapshot error in UserChat:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    setSending(true);
    try {
      const receiverId = isAdminMode ? userId : 'admin';
      await sendMessage(textToSend, userId, receiverId, isAdminMode);
      if (!customText) setInputText('');
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-neutral-950 text-neutral-50 animate-in fade-in duration-200 select-none">
      {/* Native App Style Top Chat Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
              isAdminMode 
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isAdminMode ? <UserIcon className="w-5 h-5" /> : <Shield className="w-5 h-5 text-emerald-400" />}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>{isAdminMode ? userName : 'ProJoy Support'}</span>
                {!isAdminMode && (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md uppercase">
                    Official
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                Online • Instant 24/7 Replies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs">Loading conversations...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-emerald-400 border border-neutral-800 shadow-xl">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-white font-extrabold text-sm sm:text-base">Welcome to ProJoy Live Support</p>
              <p className="text-xs text-neutral-400">
                {isAdminMode 
                  ? "Write a message to start conversing with this player." 
                  : "How can we assist you today? Tap a quick option below or type a message."
                }
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            {!isAdminMode && (
              <div className="grid grid-cols-2 gap-2 pt-2 max-w-sm w-full">
                {quickChips.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(undefined, `I need help with: ${chip}`)}
                    className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/40 rounded-xl text-xs font-semibold text-neutral-200 text-left transition-all active:scale-98 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isPlayer = msg.senderId === userId;
            
            return (
              <div 
                key={msg.id || idx}
                className={`flex ${!isPlayer ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                  !isPlayer 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-600/10' 
                    : 'bg-emerald-500 text-neutral-950 font-semibold rounded-tl-none shadow-emerald-500/10'
                }`}>
                  <p className="text-xs sm:text-sm break-words whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                  <div className={`flex items-center gap-2 mt-1.5 ${!isPlayer ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${!isPlayer ? 'text-blue-100/80' : 'text-neutral-950/60'}`}>
                      {!isPlayer ? 'Admin' : 'You'}
                    </span>
                    <span className={`text-[9px] font-medium ${!isPlayer ? 'text-blue-100/70' : 'text-neutral-950/50'}`}>
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips Row on bottom if messages exist */}
      {!isAdminMode && messages.length > 0 && (
        <div className="px-4 py-2 bg-neutral-900/60 border-t border-neutral-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {quickChips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(undefined, chip)}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-[11px] font-semibold text-neutral-300 whitespace-nowrap transition-colors active:scale-95 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Bar with Safe Area Support */}
      <div 
        className="bg-neutral-900 border-t border-neutral-800 p-3 sm:p-4 flex-shrink-0 z-20"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 8px))' }}
      >
        <form 
          onSubmit={(e) => handleSend(e)}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-neutral-950 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
