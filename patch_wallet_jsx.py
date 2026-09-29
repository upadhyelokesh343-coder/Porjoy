import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

old_jsx = """                {addStep === 'amount' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Select or Enter Amount (₹)</label>
                      <style>{`
                        @keyframes slideDownShine {
                          0% { transform: translateY(-150%) skewY(-30deg); opacity: 0; }
                          20% { opacity: 0.8; }
                          80% { transform: translateY(250%) skewY(-30deg); opacity: 0; }
                          100% { transform: translateY(250%) skewY(-30deg); opacity: 0; }
                        }
                        .animate-slide-shine {
                          animation: slideDownShine 2.5s infinite linear;
                        }
                      `}</style>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                        {predefinedAmounts.map((amt, idx) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt.toString())}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            className={`relative py-3 px-4 ${amount === amt.toString() ? 'bg-gradient-to-br from-[#E6C27A] via-[#D4AF37] to-[#AA7C11] border-[#FCEEAA] text-[#2A1D00]' : 'bg-neutral-900 border-neutral-800 text-white'} border border-b-[3px] hover:brightness-110 hover:scale-[1.02] active:scale-95 rounded-xl font-black transition-all text-sm shadow-md overflow-hidden group`}
                          >
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 flex justify-center pointer-events-none overflow-hidden">
                                <div className="w-8 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[2px] animate-slide-shine" style={{ animationDelay: `${idx * 0.15}s` }} />
                            </div>
                            <span className="relative z-10 drop-shadow-sm">₹{amt}</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter custom amount (Min ₹100)"
                          min="100"
                          className="w-full pl-8 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-lg"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Pay via RupayEx Gateway
                    </button>
                  </div>
                )}"""

new_jsx = """                {addStep === 'amount' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Select or Enter Amount (₹)</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                        {predefinedAmounts.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt.toString())}
                            className={`relative py-3 px-4 ${amount === amt.toString() ? 'bg-gradient-to-br from-[#E6C27A] via-[#D4AF37] to-[#AA7C11] border-[#FCEEAA] text-[#2A1D00]' : 'bg-neutral-900 border-neutral-800 text-white'} border border-b-[3px] hover:brightness-110 hover:scale-[1.02] active:scale-95 rounded-xl font-black transition-all text-sm shadow-md overflow-hidden group`}
                          >
                            <span className="relative z-10 drop-shadow-sm">₹{amt}</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter custom amount (Min ₹100)"
                          min="100"
                          className="w-full pl-8 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-lg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">+91</span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Proceed to Pay ₹{amount || '0'}
                    </button>
                  </div>
                )}
                
                {addStep === 'pay' && (
                  <div className="space-y-6 text-center">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-inner">
                      <p className="text-neutral-400 mb-4 text-sm font-medium">Scan QR Code or Pay to UPI ID</p>
                      
                      <div className="flex justify-center mb-4">
                        {adminQrCodeUrl ? (
                          <img src={adminQrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-neutral-800 object-cover" />
                        ) : (
                          <div className="w-48 h-48 bg-white p-2 rounded-xl border border-neutral-800 flex items-center justify-center">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${adminUpiId}&pn=Admin&am=${actualPaymentAmount}`} alt="QR Code" />
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                        <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-bold">Admin UPI ID</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-emerald-400 font-bold truncate">{adminUpiId}</p>
                          <button 
                            type="button" 
                            onClick={() => {
                              navigator.clipboard.writeText(adminUpiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="bg-neutral-900 p-2 rounded-lg text-neutral-400 hover:text-white"
                          >
                            {copiedUpi ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6">
                      <AnimatePresence mode="wait">
                        {!isSubmittingUtr ? (
                          <motion.div
                            key="utr-input"
                            exit={{ scale: 0.8, opacity: 0, rotateX: 90, filter: "blur(10px)" }}
                            transition={{ duration: 0.6, type: "spring", bounce: 0 }}
                            className="space-y-4"
                          >
                            <label className="block text-sm font-medium text-emerald-400 text-left">Step 2: Enter UTR / Ref No.</label>
                            <p className="text-xs text-neutral-400 text-left mb-2">After paying ₹{actualPaymentAmount}, enter the 12-digit UTR number here.</p>
                            <input
                              type="text"
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value.replace(/\\D/g, '').slice(0, 12))}
                              placeholder="e.g. 312345678901"
                              className="w-full px-4 py-3.5 bg-neutral-950 border border-emerald-500/30 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-widest text-lg text-center"
                            />
                            <button
                              type="submit"
                              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                            >
                              Submit UTR Number
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddStep('amount')}
                              className="text-xs text-neutral-500 hover:text-neutral-300 font-medium pt-2"
                            >
                              Go Back
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="utr-submitting"
                            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className="py-10 flex flex-col items-center justify-center space-y-4"
                          >
                            <div className="relative w-20 h-20">
                              <div className="absolute inset-0 rounded-full border-4 border-neutral-800"></div>
                              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
                              </div>
                            </div>
                            <p className="text-emerald-400 font-bold animate-pulse">Verifying UTR...</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {addStep === 'success' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="text-center py-12 bg-neutral-900 border border-emerald-500/30 rounded-3xl"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: [1.2, 1] }}
                      transition={{ type: "spring", bounce: 0.6 }}
                      className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-white mb-2">UTR Submitted!</h3>
                    <p className="text-neutral-400 px-6">Your deposit request for <strong className="text-white">₹{actualPaymentAmount}</strong> has been received.</p>
                    <p className="text-xs text-emerald-400/80 mt-2 font-mono">UTR: {utrNumber}</p>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setAddStep('amount');
                        setAmount('');
                        setUtrNumber('');
                        setPhoneNumber('');
                      }} 
                      className="mt-8 px-8 py-3 bg-neutral-950 border border-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      Done
                    </button>
                  </motion.div>
                )}"""

content = content.replace(old_jsx, new_jsx)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Replaced JSX successfully")
