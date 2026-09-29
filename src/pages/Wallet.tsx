import React, { useState, useEffect } from "react";
import { useStore } from '../store';
import { Transaction } from '../types';
import { isValid, format } from 'date-fns';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowLeft,
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Smartphone, 
  Building2, 
  Gift, 
  Zap, 
  Loader2, 
  X, 
  Copy, 
  QrCode, 
  Check, 
  ShieldCheck, 
  FileCheck2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const safeFormatDate = (dateString?: string) => {
  if (!dateString) return 'Date unavailable';
  try {
    const parsed = new Date(dateString);
    if (!isValid(parsed)) return 'Invalid date';
    return format(parsed, "dd MMM, h:mm a");
  } catch (e) {
    return 'Invalid date';
  }
};

// Animated Cartoon Character that points down directly to the UTR input box (इशारा करने वाला कार्टून)
function UtrPointingCartoon({ hasEnteredUtr }: { hasEnteredUtr: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-2.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 shadow-xs overflow-hidden"
    >
      {/* Cartoon Character Body */}
      <div className="relative shrink-0 flex flex-col items-center">
        {/* Cartoon Face with Headband and Blinking Eyes */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-12 h-12 sm:w-14 sm:h-14 relative"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm select-none">
            {/* Green Gaming Cap / Headband */}
            <path d="M 22 46 C 22 18, 78 18, 78 46 Z" fill="#10b981" />
            <circle cx="50" cy="18" r="6" fill="#f59e0b" />
            <rect x="20" y="40" width="60" height="9" rx="4.5" fill="#047857" />

            {/* Cute Face */}
            <circle cx="50" cy="56" r="28" fill="#fed7aa" />

            {/* Rosy Cheeks */}
            <circle cx="34" cy="63" r="5" fill="#fca5a5" opacity="0.85" />
            <circle cx="66" cy="63" r="5" fill="#fca5a5" opacity="0.85" />

            {/* Blinking Eyes */}
            <motion.ellipse
              cx="38"
              cy="52"
              rx="4"
              ry="5.5"
              fill="#0f172a"
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3.2, times: [0, 0.88, 0.94, 1] }}
            />
            <circle cx="39.5" cy="50" r="1.6" fill="#ffffff" />

            <motion.ellipse
              cx="62"
              cy="52"
              rx="4"
              ry="5.5"
              fill="#0f172a"
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ repeat: Infinity, duration: 3.2, times: [0, 0.88, 0.94, 1] }}
            />
            <circle cx="63.5" cy="50" r="1.6" fill="#ffffff" />

            {/* Mouth: Happy Smile or Cheerful Open Mouth */}
            {hasEnteredUtr ? (
              <path d="M 40 62 Q 50 74 60 62" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
            ) : (
              <path d="M 42 63 Q 50 71 58 63" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>
        </motion.div>

        {/* Animated Pointing Cartoon Hand / Finger Gesture pointing straight down into the box */}
        <motion.div
          animate={{ y: [0, 6, 0], scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 0.85, ease: "easeInOut" }}
          className="text-2xl sm:text-3xl -mt-1 select-none filter drop-shadow-xs"
        >
          {hasEnteredUtr ? "🎉" : "👇"}
        </motion.div>
      </div>

      {/* Speech Bubble / Message with pointing arrow towards input */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-xs animate-pulse">
            {hasEnteredUtr ? "UTR Mil Gaya!" : "Zaroori Step!"}
          </span>
          <span className="text-[11px] font-bold text-amber-900">
            {hasEnteredUtr ? "Bilkul Sahi! ✨" : "Niche Ishara Dekhein 👇"}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-black text-slate-900 mt-1 leading-snug">
          {hasEnteredUtr ? (
            <span className="text-emerald-700">
              UTR number enter ho gaya hai! Ab niche submit button dabayein taaki paise turant credit hon.
            </span>
          ) : (
            <span>
              Payment ke baad receipt se dekh kar <strong className="text-amber-800 underline decoration-amber-500 decoration-2">12-Digit UTR Number</strong> yahan dalein!
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

export default function Wallet() {
  const currentUser = useStore(state => state.currentUser);
  const requestDeposit = useStore(state => state.requestDeposit);
  const requestWithdraw = useStore(state => state.requestWithdraw);
  const updateTransactionUtr = useStore(state => state.updateTransactionUtr);
  const adminUpiId = useStore(state => state.adminUpiId) || '7285009425-2@ybl';
  const adminQrCodeUrl = useStore(state => state.adminQrCodeUrl) || '';
  const isDepositLocked = useStore(state => state.isDepositLocked);
  const depositLockMessage = useStore(state => state.depositLockMessage);
  const minDepositAmount = useStore(state => state.minDepositAmount) || 100;
  const setIsPaymentGatewayOpen = useStore(state => state.setIsPaymentGatewayOpen);
  const allTransactions = useStore(state => state.transactions) || [];

  const transactions = (allTransactions || []).filter(t => t?.userId === currentUser?.id);
  const hasDeposited = transactions.some(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'));

  // Standard preset deposit amounts shown on the wallet UI (₹100, ₹200, ₹300, etc.)
  const predefinedAmounts = [100, 200, 300, 500, 1000, 2000, 5000, 10000];
  const [amount, setAmount] = useState('100');
  const [baseCreditAmount, setBaseCreditAmount] = useState<number>(100);
  const [payAmount, setPayAmount] = useState<number>(99);
  const [utr, setUtr] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  // Payment Gateway Modal & 5-Second Connecting Transition
  const [selectedGatewayMethod, setSelectedGatewayMethod] = useState<'qr' | 'upi'>('qr');
  const [isGatewayConnecting, setIsGatewayConnecting] = useState(false);
  const [gatewayCountdown, setGatewayCountdown] = useState(5);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gatewaySessionSeconds, setGatewaySessionSeconds] = useState(300); // 5 minutes gateway timer
  const [currentGatewayOrderRef, setCurrentGatewayOrderRef] = useState('');

  // Sync with store to hide bottom mobile navigation and top header when payment gateway is open
  useEffect(() => {
    setIsPaymentGatewayOpen(isGatewayModalOpen || isGatewayConnecting);
    return () => {
      setIsPaymentGatewayOpen(false);
    };
  }, [isGatewayModalOpen, isGatewayConnecting, setIsPaymentGatewayOpen]);

  // Manual UTR edit for pending transactions
  const [isUtrModalOpen, setIsUtrModalOpen] = useState(false);
  const [selectedOrderRef, setSelectedOrderRef] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  // Transfer / Withdrawal Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'upi' | 'bank' | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUpiId, setTransferUpiId] = useState('');
  const [transferAccountNo, setTransferAccountNo] = useState('');
  const [transferConfirmAccountNo, setTransferConfirmAccountNo] = useState('');
  const [transferIfsc, setTransferIfsc] = useState('');
  const [transferAccountName, setTransferAccountName] = useState('');
  const [transferBankName, setTransferBankName] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Toast / Status Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ amount: number; method: string; type?: 'deposit' | 'withdraw' }>({ amount: 0, method: '', type: 'deposit' });

  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  // 5-Second Gateway Connecting Countdown Timer
  useEffect(() => {
    if (!isGatewayConnecting) return;
    if (gatewayCountdown <= 0) {
      setIsGatewayConnecting(false);
      setIsGatewayModalOpen(true);
      return;
    }
    const timer = setTimeout(() => {
      setGatewayCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isGatewayConnecting, gatewayCountdown]);

  // 5-Minute Gateway Session Expiry Timer
  useEffect(() => {
    if (!isGatewayModalOpen) return;
    if (gatewaySessionSeconds <= 0) {
      setIsGatewayModalOpen(false);
      showError('Payment session timed out. Please try again.');
      return;
    }
    const interval = setInterval(() => {
      setGatewaySessionSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGatewayModalOpen, gatewaySessionSeconds]);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Realtime Automatic Detection: Detect when ONLY the current active gateway order is verified by webhook/admin
  useEffect(() => {
    if (!isGatewayModalOpen || !currentGatewayOrderRef) return;
    
    // 1. Check local transactions state from Firestore realtime listener
    const matchedTx = transactions.find(
      t => (t.reference === currentGatewayOrderRef || t.id === currentGatewayOrderRef || t.merchantOrderNo === currentGatewayOrderRef) &&
      (t.status === 'completed' || t.status === 'approved')
    );
    if (matchedTx) {
      setIsGatewayModalOpen(false);
      setSuccessDetails({ amount: matchedTx.amount, method: selectedGatewayMethod });
      setIsSuccessModalOpen(true);
      showSuccess(`Payment of ₹${matchedTx.amount} confirmed automatically and credited!`);
      return;
    }

    // 2. Active server polling check every 3 seconds for instant webhook detection
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bondpay/check-status/${currentGatewayOrderRef}`);
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.success && (statusData.status === 'completed' || statusData.status === 'approved')) {
            setIsGatewayModalOpen(false);
            setSuccessDetails({ amount: statusData.amount || amount, method: selectedGatewayMethod });
            setIsSuccessModalOpen(true);
            showSuccess(`Payment of ₹${statusData.amount || amount} confirmed automatically and credited!`);
          }
        }
      } catch (err) {
        // quiet fail on background polling
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [transactions, isGatewayModalOpen, currentGatewayOrderRef, selectedGatewayMethod]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTransferModalOpen) setIsTransferModalOpen(false);
        if (isUtrModalOpen) setIsUtrModalOpen(false);
        if (isGatewayModalOpen) setIsGatewayModalOpen(false);
        if (isGatewayConnecting) setIsGatewayConnecting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransferModalOpen, isUtrModalOpen, isGatewayModalOpen, isGatewayConnecting]);

  if (!currentUser) return null;

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(adminUpiId);
    setCopiedUpi(true);
    showSuccess('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Helper to convert base amount (e.g. 100, 200, 300) into dynamic odd amount (ends in 99 or 98)
  const calculateDynamicPayAmount = (val: number): number => {
    const minLimit = minDepositAmount || 100;
    if (val < minLimit) return minLimit - 1;
    if (val % 10 === 0) {
      const offset = Math.random() < 0.5 ? 1 : 2;
      return Math.max(minLimit - 2, val - offset);
    }
    if (val % 10 === 9 || val % 10 === 8) {
      return val;
    }
    const offset = Math.random() < 0.5 ? 1 : 2;
    return Math.max(minLimit - 2, val - offset);
  };

  // Initiate Payment Gateway: Open QR Code & UPI Modal with clean base amount converted to dynamic odd amount
  const handleInitiatePayment = (method: 'qr' | 'upi') => {
    const minLimit = minDepositAmount || 100;
    const baseVal = Math.floor(Number(amount)) || minLimit;
    if (baseVal < minLimit) {
      setAmount(minLimit.toString());
      showError(`Minimum deposit amount ₹${minLimit} hai! ₹10 ya ₹2 jaise kam amount allow nahi hain.`);
      return;
    }

    const dynPay = calculateDynamicPayAmount(baseVal);
    setBaseCreditAmount(baseVal);
    setPayAmount(dynPay);

    // Generate brand new unique order reference so QR code is freshly generated every single time
    const orderRef = `PJ_${Date.now().toString().slice(-6)}_${Math.floor(100 + Math.random() * 900)}`;
    setSelectedGatewayMethod(method);
    setCurrentGatewayOrderRef(orderRef);
    setGatewaySessionSeconds(300);
    setIsGatewayConnecting(false);
    setIsGatewayModalOpen(true);
    setUtr('');
  };

  // Generate UPI payment intent URI with exact odd amount, payee name, transaction note & unique reference
  const numericAmount = payAmount || 99;
  const formattedAmount = Number(numericAmount).toFixed(2);
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(adminUpiId)}&pn=${encodeURIComponent('ProJoy Esports')}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`ProJoy ${currentGatewayOrderRef || 'PJ'}`)}&tr=${encodeURIComponent(currentGatewayOrderRef || 'PJ')}&mc=5816&mode=02`;
  
  // Dynamic Amount-Locked QR Code Image source with cache-buster parameter so it visually updates instantly
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiIntentUri)}&color=000000&bgcolor=ffffff&margin=10&_t=${encodeURIComponent(currentGatewayOrderRef || 'initial')}`;

  /**
   * MANUAL QR CODE & UPI DEPOSIT SUBMIT HANDLER
   */
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseCreditAmount || baseCreditAmount < 10) {
      showError('Minimum deposit amount is ₹10');
      return;
    }

    const cleanUtr = utr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      showError('Please enter the 12-digit UPI UTR / Reference number from your payment app');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const ref = currentGatewayOrderRef || `PJ_${Date.now()}`;
      const txId = await requestDeposit(baseCreditAmount, ref, payAmount, cleanUtr);
      
      if (txId) {
        setIsGatewayModalOpen(false);
        setSuccessDetails({ amount: baseCreditAmount, method: selectedGatewayMethod });
        setIsSuccessModalOpen(true);
        showSuccess(`Deposit request of ₹${baseCreditAmount} submitted successfully! (Paid: ₹${payAmount})`);
        setUtr('');
      } else {
        showError('Failed to record deposit request. Please try again.');
      }
    } catch (err: any) {
      console.error("Deposit submission error:", err);
      showError(err?.message || 'Error submitting deposit request.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  /**
   * UTR MANUAL UPDATE MODAL HANDLER
   */
  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = utrInput.trim();
    if (!clean || clean.length < 6) {
      showError('Please enter a valid 12-digit UPI UTR / Transaction reference.');
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const targetRef = selectedOrderRef || `DEP_${Date.now()}`;
      const success = await updateTransactionUtr(targetRef, clean);
      if (success) {
        showSuccess('UTR details updated successfully! Verification in progress.');
        setIsUtrModalOpen(false);
        setUtrInput('');
      } else {
        showError('Failed to update UTR. Please try again.');
      }
    } catch (err: any) {
      console.error('UTR Submit Error:', err);
      showError(err?.message || 'Failed to submit UTR.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  /**
   * WITHDRAWAL HANDLER
   */
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hasPlayedMatch = allTransactions.some(t => t.userId === currentUser.id && t.type === 'join_fee');
      if (!hasPlayedMatch) {
        showError('Withdraw karne ke liye aapko kam se kam 1 match join karna zaroori hai.');
        return;
      }

      const amt = Math.floor(Number(transferAmount));
      if (!amt || amt <= 0) {
        showError('Please enter a valid transfer amount.');
        return;
      }
      if (amt < 50) {
        showError('Minimum withdrawal amount is ₹50');
        return;
      }
      if (amt > currentUser.balance) {
        showError('Insufficient balance in wallet.');
        return;
      }

      if (!transferType) {
        showError('Please select a transfer destination.');
        return;
      }

      if (transferType === 'upi' && !transferUpiId.trim()) {
        showError('Please enter a valid UPI ID.');
        return;
      }

      if (transferType === 'bank') {
        if (!transferBankName.trim() || !transferAccountName.trim() || !transferAccountNo.trim() || !transferIfsc.trim()) {
          showError('Please fill in all bank details.');
          return;
        }
        if (transferAccountNo !== transferConfirmAccountNo) {
          showError('Account numbers do not match.');
          return;
        }
      }

      let details = '';
      if (transferType === 'upi') {
        details = `Transfer to UPI: ${transferUpiId.trim()}`;
      } else {
        details = `Bank Transfer: ${transferBankName.trim()} | A/C: ${transferAccountNo} | IFSC: ${transferIfsc.trim()} | Name: ${transferAccountName.trim()}`;
      }

      setIsSubmittingWithdraw(true);
      await requestWithdraw(amt, details);
      setSuccessDetails({ amount: amt, method: transferType || 'upi', type: 'withdraw' });
      setIsTransferModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      showError(err?.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const renderStatusBadge = (tx: Transaction) => {
    const isSuccess = tx.status === 'completed' || tx.status === 'approved';
    const isFailed = tx.status === 'failed' || tx.status === 'rejected';

    if (isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SUCCESS
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md">
          <XCircle className="w-3 h-3 text-red-400" /> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3 text-yellow-400" /> PENDING
      </span>
    );
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
        {/* Total Balance Hero Card */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-neutral-900 border border-emerald-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
            <WalletIcon className="w-36 h-36 sm:w-48 sm:h-48 text-emerald-500" />
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm font-medium mb-1">Total Balance</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6">₹{currentUser.balance}</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById('deposit-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Money</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setTransferType(null);
                setTransferAmount('');
                setTransferUpiId('');
                setTransferAccountNo('');
                setTransferConfirmAccountNo('');
                setTransferIfsc('');
                setTransferAccountName('');
                setTransferBankName('');
                setIsTransferModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Toast Alerts */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/90 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-red-400 text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500/90 text-white px-3.5 py-2.5 rounded-xl shadow-lg border border-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personal QR Code & UPI Deposit Section */}
        <div id="deposit-section" className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 sm:pb-4">
            <div>
              <h3 className="font-bold text-base sm:text-xl text-white flex items-center gap-2">
                <WalletIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                Add Money to Wallet
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">Instant Deposit via QR Code, PhonePe, Google Pay, Paytm & UPI</p>
            </div>
            
            <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] sm:text-xs font-bold">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span>Instant</span>
            </div>
          </div>

          {isDepositLocked ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="text-white font-bold text-sm sm:text-base">Deposit is Currently Locked</h4>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xs mx-auto">
                {depositLockMessage}
              </p>
              <div className="pt-1">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider italic">Locked by Admin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {!hasDeposited && (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg sm:rounded-xl text-yellow-400 shrink-0">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">First Deposit Bonus!</h4>
                    <p className="text-[11px] sm:text-xs text-neutral-400">
                      Get an extra <strong className="text-yellow-400">20% bonus</strong> automatically added to your wallet upon your first approved deposit!
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Amount Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-neutral-300">
                    1. Select Deposit Amount (₹)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" /> Instant QR
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
                  {predefinedAmounts.map((val) => {
                    const isSelected = Number(amount) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val.toString())}
                        className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl font-black transition-all border cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-neutral-950 text-white border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">₹{val.toLocaleString('en-IN')}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm sm:text-base">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={(e) => {
                      // Strictly digits only: prevents typing decimal points, paise, minus, or non-numbers
                      const cleanedDigits = e.target.value.replace(/\D/g, '');
                      setAmount(cleanedDigits);
                    }}
                    onBlur={() => {
                      const numVal = parseInt(amount, 10);
                      if (!amount || isNaN(numVal) || numVal < minDepositAmount) {
                        setAmount(minDepositAmount.toString());
                      }
                    }}
                    placeholder="Enter amount (e.g. 100, 200, 500...)"
                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-sm sm:text-lg"
                  />
                </div>

                <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center justify-between">
                  <span>⚡ Instant automatic credit via Dynamic QR Code & UPI apps</span>
                  <span className="text-[10px] text-neutral-500 font-medium">Whole ₹ only (No paise)</span>
                </p>
              </div>

              {/* Step 2: 2 Box Sized Payment Method Buttons */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-300 mb-2 sm:mb-3">
                  2. Choose Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Box 1: QR Code Button */}
                  <button
                    type="button"
                    onClick={() => handleInitiatePayment('qr')}
                    disabled={!amount || Number(amount) < minDepositAmount}
                    className="group relative p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all text-left shadow-xl hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[140px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-neutral-950 transition-all shadow-md">
                        <QrCode className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> QR Code
                      </span>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <h4 className="text-xs sm:text-base font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                        Pay with QR Code <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                        Scan & Pay ₹{amount || minDepositAmount} via PhonePe, GPay, Paytm, BHIM
                      </p>
                    </div>
                  </button>

                  {/* Box 2: UPI Apps & ID Button */}
                  <button
                    type="button"
                    onClick={() => handleInitiatePayment('upi')}
                    disabled={!amount || Number(amount) < minDepositAmount}
                    className="group relative p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border-2 border-blue-500/30 hover:border-blue-400 transition-all text-left shadow-xl hover:shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[140px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-md">
                        <Smartphone className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Direct UPI
                      </span>
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <h4 className="text-xs sm:text-base font-black text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                        Pay via UPI Apps / ID <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </h4>
                      <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                        1-Click Mobile UPI Intent & Copy Official UPI ID (₹{amount || minDepositAmount})
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Security Info */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-500 pt-1 border-t border-neutral-800/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
                </span>
                <span className="font-medium text-neutral-400">Zero Processing Fees</span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Transaction History
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Live status of your deposits, withdrawals & game winnings</p>
            </div>
          </div>

          {/* Filter Tabs */}
          {(() => {
            const displayTransactions = transactions.filter(t => !(t.type === 'deposit' && (t.status === 'pending' || !t.status) && (!t.utr || !String(t.utr).trim())));
            
            return (
              <>
                {displayTransactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl">
                    {[
                      { key: 'all', label: 'All', count: displayTransactions.length },
                      { 
                        key: 'success', 
                        label: 'Success', 
                        count: displayTransactions.filter(t => t.status === 'completed' || t.status === 'approved').length 
                      },
                      { 
                        key: 'pending', 
                        label: 'Pending', 
                        count: displayTransactions.filter(t => (t.status === 'pending' || !t.status) && t.type === 'deposit').length 
                      },
                      { 
                        key: 'failed', 
                        label: 'Failed', 
                        count: displayTransactions.filter(t => t.status === 'failed' || t.status === 'rejected').length 
                      },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setHistoryFilter(tab.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          historyFilter === tab.key
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          historyFilter === tab.key ? 'bg-neutral-700 text-white' : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {displayTransactions.length === 0 ? (
                    <div className="text-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl text-neutral-500">
                      No transactions yet.
                    </div>
                  ) : (() => {
                    const filteredList = displayTransactions.filter(tx => {
                      if (historyFilter === 'all') return true;
                      if (historyFilter === 'success') return tx.status === 'completed' || tx.status === 'approved';
                      if (historyFilter === 'pending') return tx.status === 'pending' || (!tx.status && tx.type === 'deposit');
                      if (historyFilter === 'failed') return tx.status === 'failed' || tx.status === 'rejected';
                      return true;
                    });

                    if (filteredList.length === 0) {
                      return (
                        <div className="text-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl text-neutral-500 text-xs">
                          No {historyFilter} transactions found.
                        </div>
                      );
                    }

              return filteredList.map((tx) => {
                const isDeposit = tx.type === 'deposit' || tx.type === 'prize';
                const isPending = tx.status === 'pending' || (!tx.status && tx.type === 'deposit');

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={tx.id} 
                    className={`bg-neutral-950 border rounded-2xl p-4 transition-all ${
                      isPending ? 'border-yellow-500/30' : tx.status === 'failed' || tx.status === 'rejected' ? 'border-red-500/20' : 'border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {isDeposit ? <Plus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-white capitalize text-sm sm:text-base">
                              {(tx.type || 'transaction').replace('_', ' ')}
                            </p>
                            {renderStatusBadge(tx)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <span>{safeFormatDate(tx.date)}</span>
                          </div>

                          {isDeposit && tx.reference && (
                            <p className="text-[11px] text-neutral-500 font-mono">Order: {tx.reference}</p>
                          )}
                          {!isDeposit && tx.reference && (
                            <p className="text-[11px] text-neutral-400 font-medium">
                              {tx.reference}
                            </p>
                          )}
                          {isDeposit && tx.utr && tx.utr.trim() && (
                            <p className="text-[11px] text-yellow-400 font-mono">
                              UTR: <span className="font-bold">{tx.utr}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-black text-base sm:text-lg ${
                          isDeposit ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isDeposit ? '+' : '-'}₹{tx.amount}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </>
      );
    })()}
  </div>
      </div>

      {/* 5-Second Payment Gateway Connecting Screen Overlay */}
      <AnimatePresence>
        {isGatewayConnecting && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-emerald-500/30 rounded-3xl max-w-sm w-full p-7 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Glow background effect */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Animated Central Spinner / Gateway Badge */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                {/* Circular Countdown Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#262626"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * (5 - gatewayCountdown)) / 5}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white font-mono">{gatewayCountdown}s</span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Securing</span>
                </div>
              </div>

              {/* Header and Step Info */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Encrypted Payment Session</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Connecting to Payment Gateway
                </h3>
                <p className="text-xs text-neutral-400">
                  {gatewayCountdown === 5 && 'Initializing secure connection...'}
                  {gatewayCountdown === 4 && 'Generating dynamic UPI order...'}
                  {gatewayCountdown === 3 && 'Routing to official UPI network...'}
                  {gatewayCountdown === 2 && 'Preparing merchant payment checkout...'}
                  {gatewayCountdown <= 1 && 'Opening Payment Gateway...'}
                </p>
              </div>

              {/* Deposit Summary Pill */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Order Amount</span>
                <span className="text-lg font-black text-emerald-400">₹{amount || '99'}</span>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setIsGatewayConnecting(false)}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-medium cursor-pointer"
              >
                Cancel Payment
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen White Background Payment Gateway Checkout Page with Slide-to-Dismiss Gesture & Cartoon Cut Option */}
      <AnimatePresence>
        {isGatewayModalOpen && (
          <div className="fixed inset-0 z-[100] bg-white sm:bg-slate-100/95 sm:backdrop-blur-sm overflow-y-auto flex flex-col items-center justify-start sm:p-4 md:p-6 animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-0 sm:border sm:border-slate-200 sm:rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col min-h-screen sm:min-h-0 text-slate-900 my-0 sm:my-auto"
            >
              {/* White Theme Gateway Top Header Bar */}
              <div className="bg-white p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGatewayModalOpen(false)}
                    className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                    <span className="hidden xs:inline">Cancel</span>
                  </button>
                  <div className="h-6 w-[1px] bg-slate-200" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">ProJoy Pay</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md tracking-wider">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Order: {currentGatewayOrderRef}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-mono font-bold shadow-xs">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                    <span>{formatSessionTime(gatewaySessionSeconds)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGatewayModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Amount to Pay Clean Ribbon */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Amount to Pay</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">₹{payAmount}</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe
                  </span>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">₹{baseCreditAmount} Wallet me credit hoga</p>
                </div>
              </div>

              {/* White Background Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
                {/* 2-Tab Gateway Method Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSelectedGatewayMethod('qr')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedGatewayMethod === 'qr'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code Scanner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGatewayMethod('upi')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedGatewayMethod === 'upi'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI Apps & ID</span>
                  </button>
                </div>

                {/* Tab 1: QR Code View */}
                {selectedGatewayMethod === 'qr' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Official Merchant QR Box */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-[240px] sm:max-w-[270px] mx-auto text-center shadow-lg border-2 border-slate-200 relative overflow-hidden">
                      {/* Laser Scanning Line Animation */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#10b981] animate-bounce pointer-events-none opacity-80" />

                      <img
                        key={currentGatewayOrderRef}
                        src={qrImageSrc}
                        alt="Official Merchant QR"
                        className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain rounded-lg"
                      />
                      <div className="mt-2.5 text-center">
                        <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase block">
                          Scan with any UPI App
                        </span>
                        <span className="text-base font-black text-emerald-700 block mt-0.5">
                          Amount to Pay: ₹{payAmount}
                        </span>
                      </div>
                    </div>

                    {/* Live Listening Auto-Detection Badge */}
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-full max-w-xs mx-auto text-xs font-bold text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span>Live Listening for UPI Payment...</span>
                    </div>

                    {/* UPI ID Quick Copy Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Official Merchant UPI ID</p>
                        <p className="font-mono text-xs sm:text-sm font-black text-slate-900 truncate select-all">
                          {adminUpiId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyUpiToClipboard}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                      </button>
                    </div>

                    {/* Direct Open in App Button */}
                    <div className="text-center">
                      <a
                        href={upiIntentUri}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all w-full shadow-md"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>Click to Pay Directly via Mobile UPI App</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Tab 2: UPI Apps & ID View */}
                {selectedGatewayMethod === 'upi' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        1. Launch Installed UPI App:
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <a
                          href={upiIntentUri}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors shadow-xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                          <span>PhonePe</span>
                        </a>
                        <a
                          href={upiIntentUri}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors shadow-xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>Google Pay</span>
                        </a>
                        <a
                          href={upiIntentUri}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors shadow-xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                          <span>Paytm</span>
                        </a>
                        <a
                          href={upiIntentUri}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors shadow-xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                          <span>BHIM UPI</span>
                        </a>
                      </div>
                    </div>

                    {/* UPI ID Copy Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                      <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                        2. Or Pay Manually to Official UPI ID:
                      </p>
                      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 select-all truncate">
                          {adminUpiId}
                        </span>
                        <button
                          type="button"
                          onClick={copyUpiToClipboard}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Step: Enter 12-Digit UTR Number */}
                <form onSubmit={handleDepositSubmit} className="space-y-3.5 pt-3 border-t border-slate-200">
                  <div className="space-y-1.5">
                    {/* Animated Cartoon Character pointing down directly to the UTR number input box */}
                    <UtrPointingCartoon hasEnteredUtr={utr.trim().length >= 6} />

                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                        Enter 12-Digit UPI Ref / UTR No.
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            const digits = text.replace(/[^0-9]/g, '');
                            if (digits) {
                              setUtr(digits.slice(0, 12));
                              showSuccess('Pasted UTR from clipboard!');
                            }
                          } catch (e) {
                            showError('Could not read clipboard. Please paste manually.');
                          }
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Paste from Clipboard
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={utr}
                        onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ''))}
                        placeholder="e.g. 508492817291 (12 digits)"
                        className={`w-full px-4 py-3 sm:py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono font-black text-sm sm:text-base shadow-xs tracking-wider ${
                          utr.trim().length >= 6
                            ? 'border-emerald-500 focus:border-emerald-600 focus:bg-white bg-emerald-50/20'
                            : 'border-amber-400 ring-2 ring-amber-300/40 focus:border-amber-600 focus:bg-white'
                        }`}
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>Payment karne ke baad UTR Number daalna zaroori hai:</span>
                      </p>
                      <p className="text-amber-800 text-[10.5px]">
                        PhonePe / Google Pay / Paytm par payment hone ke baad receipt mein <strong>12-Digit UPI Ref / UTR No.</strong> (jaise 508492817291) likha hota hai, usse copy karke yahan paste karein aur niche button dabayein.
                      </p>
                    </div>
                  </div>

                  {/* Submit Verification Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingDeposit || !utr.trim()}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isSubmittingDeposit ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying Payment...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 fill-current" />
                        <span>Submit 12-Digit UTR & Add Money (₹{baseCreditAmount})</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom Trust Info */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> NPCI UPI Verified
                  </span>
                  <span>•</span>
                  <span className="font-medium">256-Bit SSL Encrypted</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer / Withdrawal Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-blue-400" /> Transfer Money
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Withdraw funds directly to your UPI ID or Bank account</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  1. Select Destination
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTransferType('upi')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      transferType === 'upi'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-xs font-bold">UPI ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('bank')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      transferType === 'bank'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                    <span className="text-xs font-bold">Bank Account</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  2. Transfer Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="50"
                    max={currentUser.balance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Min ₹50"
                    className="w-full pl-8 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-bold text-base focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-1">
                  <span>Available Balance: ₹{currentUser.balance}</span>
                  <button 
                    type="button" 
                    onClick={() => setTransferAmount(currentUser.balance.toString())}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    Max Amount
                  </button>
                </div>
              </div>

              {transferType === 'upi' && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Enter UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    value={transferUpiId}
                    onChange={(e) => setTransferUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {transferType === 'bank' && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={transferBankName}
                      onChange={(e) => setTransferBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={transferAccountName}
                      onChange={(e) => setTransferAccountName(e.target.value)}
                      placeholder="Name as per bank account"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      value={transferAccountNo}
                      onChange={(e) => setTransferAccountNo(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Confirm Account Number</label>
                    <input
                      type="text"
                      required
                      value={transferConfirmAccountNo}
                      onChange={(e) => setTransferConfirmAccountNo(e.target.value)}
                      placeholder="Re-enter account number"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={transferIfsc}
                      onChange={(e) => setTransferIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingWithdraw || !transferType || !transferAmount || Number(transferAmount) < 50 || Number(transferAmount) > currentUser.balance}
                className="w-full py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
              >
                {isSubmittingWithdraw ? 'Processing Transfer...' : `Confirm & Request Payout (₹${transferAmount || '0'})`}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`border rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl relative overflow-hidden ${
              successDetails.type === 'withdraw'
                ? 'bg-gradient-to-b from-neutral-900 to-neutral-950 border-blue-500/40'
                : 'bg-gradient-to-b from-neutral-900 to-neutral-950 border-emerald-500/30'
            }`}
          >
            {successDetails.type === 'withdraw' ? (
              <>
                {/* Glowing animated background orb */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/40 shadow-lg shadow-blue-500/20 animate-pulse">
                  <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    Withdrawal Processing
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">₹{successDetails.amount} Payout Requested!</h3>
                </div>

                {/* 24 Hours Notice Animated Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4 text-left space-y-2 shadow-inner"
                >
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>24 Ghante Ke Andar Payment</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Aapka <strong className="text-white">₹{successDetails.amount}</strong> ka withdrawal request successfully accept ho gaya hai. 
                    Payment <strong className="text-blue-300 font-bold">24 ghante ke andar</strong> aapke account / UPI ID mein credit ho jayega.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% Safe & Verified Payout</span>
                  </div>
                </motion.div>

                <button
                  type="button"
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Theek Hai / Done
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20 animate-bounce">
                  <Check className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Deposit Request Submitted!</h3>
                <p className="text-xs text-neutral-400">
                  Aapki ₹{successDetails.amount} ki deposit request successfully submit ho chuki hai. Verification ke baad wallet balance credit ho jayega.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
