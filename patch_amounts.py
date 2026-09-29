import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# 1. Update predefinedAmounts
content = content.replace("const predefinedAmounts = [100];", "const predefinedAmounts = [100, 200, 300, 400, 500, 600, 700, 800];")

# 2. Update Grid
content = content.replace('className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3"', 'className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3"')

# 3. Update Input box
old_input = """                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter amount (Min ₹100)"
                          min="100"
                          max="100"
                          readOnly
                          className="w-full pl-8 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-400 placeholder-neutral-600 focus:outline-none transition-colors font-bold text-lg cursor-not-allowed opacity-80"
                        />"""

new_input = """                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Enter custom amount (Min ₹100)"
                          min="100"
                          className="w-full pl-8 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors font-bold text-lg"
                        />"""

content = content.replace(old_input, new_input)

# 4. Update Button Logic
old_btn = """                        if (!val || val !== 100) {
                          showError('Amount must be exactly ₹100');
                          return;
                        }"""

new_btn = """                        if (!val || val < 100) {
                          showError('Minimum deposit amount is ₹100');
                          return;
                        }"""

content = content.replace(old_btn, new_btn)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Amounts patched successfully.")
