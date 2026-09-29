import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Wallet, User, ShieldCheck, Gift, MessageSquare } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import UserChat from './UserChat';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const currentUser = useStore(state => state.currentUser);
  const isPaymentGatewayOpen = useStore(state => state.isPaymentGatewayOpen);
  const navigate = useNavigate();
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

  if (!currentUser) {
    return <Outlet />;
  }

  return (
    <div 
      className={cn(
        "min-h-screen text-neutral-50 flex flex-col md:pb-0 transition-colors",
        isPaymentGatewayOpen ? "bg-slate-100" : "bg-neutral-950"
      )} 
      style={{ paddingBottom: (isPaymentGatewayOpen || isMessengerOpen) ? '0px' : 'calc(96px + env(safe-area-inset-bottom, 12px))' }}
    >
      {/* Sticky top Header (hidden when in payment gateway or messenger) */}
      {!isPaymentGatewayOpen && !isMessengerOpen && (
        <div className="sticky top-0 z-50 w-full flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <header className="w-full flex justify-between items-center px-4 md:px-8 py-3 bg-gradient-to-b from-neutral-800 to-neutral-950 border-b border-neutral-800 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-lg flex-shrink-0">
                <img src="/logo.jpg" alt="ProJoy Logo" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-md">
                <span className="text-white">Pro</span><span className="text-emerald-400">Joy</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wallet Balance in Header */}
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-700/50 shadow-inner rounded-full px-3 py-1.5 md:px-4 md:py-2 cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => navigate('/wallet')}>
                <Wallet className="w-4 h-4 md:w-4 md:h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm md:text-base">₹{currentUser.balance}</span>
              </div>

              {/* Quick Messenger Trigger in Header */}
              <button
                type="button"
                onClick={() => setIsMessengerOpen(true)}
                className="relative p-2 bg-neutral-900 border border-neutral-700/60 hover:border-emerald-500/50 rounded-full text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Live Support Chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-900 animate-pulse" />
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex gap-6 items-center font-semibold ml-2">
                <NavLink to="/" className={({isActive}) => cn("hover:text-emerald-400 transition-colors", isActive && "text-emerald-400")}>Home</NavLink>
                <NavLink to="/rewards" className={({isActive}) => cn("hover:text-emerald-400 transition-colors", isActive && "text-emerald-400")}>Rewards</NavLink>
                <NavLink to="/wallet" className={({isActive}) => cn("hover:text-emerald-400 transition-colors", isActive && "text-emerald-400")}>Wallet</NavLink>
                <NavLink to="/profile" className={({isActive}) => cn("hover:text-emerald-400 transition-colors", isActive && "text-emerald-400")}>Profile</NavLink>
                {currentUser.role === 'admin' && (
                  <NavLink to="/admin" className={({isActive}) => cn("flex items-center gap-1 text-purple-400 hover:text-purple-300", isActive && "text-purple-300")}>
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </NavLink>
                )}
              </nav>
            </div>
          </header>
        </div>
      )}

      <main className={cn(
        "flex-1 w-full max-w-7xl mx-auto overflow-y-auto overflow-x-hidden",
        (isPaymentGatewayOpen || isMessengerOpen) ? "p-0 m-0 max-w-none" : "px-4 md:px-6 py-6 md:pb-6"
      )}>
        {/* Page Content */}
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      {/* Floating Messenger Action Button (Mobile & Desktop) */}
      {!isPaymentGatewayOpen && !isMessengerOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMessengerOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 p-3.5 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center gap-2 font-black text-xs cursor-pointer border-2 border-emerald-400/40"
          title="Open Support Messenger"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neutral-950 rounded-full border border-emerald-400 animate-ping" />
          </div>
          <span className="hidden sm:inline font-bold">Live Support</span>
        </motion.button>
      )}

      {/* Mobile Bottom Navigation (hidden when in payment gateway or messenger) */}
      {!isPaymentGatewayOpen && !isMessengerOpen && (
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 z-50 px-6 pt-3.5 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
          style={{ paddingBottom: 'calc(18px + env(safe-area-inset-bottom, 12px))' }}
        >
          <NavLink to="/" className={({isActive}) => cn("flex flex-col items-center gap-1 text-xs", isActive ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300")}>
            <Home className="w-6 h-6" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/rewards" className={({isActive}) => cn("flex flex-col items-center gap-1 text-xs", isActive ? "text-pink-400" : "text-neutral-500 hover:text-neutral-300")}>
            <Gift className="w-6 h-6" />
            <span>Rewards</span>
          </NavLink>
          <NavLink to="/wallet" className={({isActive}) => cn("flex flex-col items-center gap-1 text-xs", isActive ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300")}>
            <Wallet className="w-6 h-6" />
            <span>Wallet</span>
          </NavLink>
          {currentUser.role === 'admin' && (
             <NavLink to="/admin" className={({isActive}) => cn("flex flex-col items-center gap-1 text-xs", isActive ? "text-purple-400" : "text-neutral-500 hover:text-neutral-300")}>
               <ShieldCheck className="w-6 h-6" />
               <span>Admin</span>
             </NavLink>
          )}
          <NavLink to="/profile" className={({isActive}) => cn("flex flex-col items-center gap-1 text-xs", isActive ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300")}>
            <User className="w-6 h-6" />
            <span>Profile</span>
          </NavLink>
        </nav>
      )}

      {/* Full-Screen Native Messenger Modal */}
      <AnimatePresence>
        {isMessengerOpen && (
          <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col h-[100dvh] w-screen overflow-hidden">
            <UserChat 
              userId={currentUser.id} 
              userName={currentUser.name || "Player"} 
              onBack={() => setIsMessengerOpen(false)} 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
