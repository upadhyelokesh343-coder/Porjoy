import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Replace the Add money form
start_marker = r"\{\s*addStep === 'amount' && \("
end_marker = r"\)\}\n\s*</motion\.div>"

# We need to find the whole block from `{addStep === 'amount' && (` down to the end of `{addStep === 'pay' && (...)}`
# To be safe, let's just find the exact text using regex

pattern = re.compile(r"\{\s*addStep === 'amount' && \([\s\S]*?\{\s*addStep === 'pay' && \([\s\S]*?Submit Deposit Proof\s*</button>\s*</div>\s*</div>\s*\)\}", re.MULTILINE)

replacement = """{addStep === 'amount' && (
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
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
                          placeholder="Enter amount (Min ₹100)"
                          min="100"
                          max="100"
                          readOnly
                          className="w-full pl-8 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 placeholder-neutral-600 focus:outline-none transition-colors font-bold text-lg cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const val = Number(amount);
                        if (!val || val !== 100) {
                          showError('Amount must be exactly ₹100');
                          return;
                        }
                        
                        try {
                          // RupayEx Create Order Flow
                          const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(7);
                          const res = await fetch('/api/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: val,
                              order_id: orderId,
                              redirect_url: window.location.origin + '/wallet'
                            })
                          });
                          
                          const data = await res.json();
                          if (data.status === true || data.payment_url) {
                            window.location.href = data.payment_url;
                          } else {
                            showError(data.message || 'Payment gateway configuration error');
                          }
                        } catch (err) {
                          showError('Failed to initiate payment. Please try again.');
                        }
                      }}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Pay via RupayEx Gateway
                    </button>
                  </div>
                )}"""

content = pattern.sub(replacement, content)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Patch applied successfully.")
