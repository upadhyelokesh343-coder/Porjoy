import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Replace the whole handleSubmit function
old_handleSubmit = r"""  const handleSubmit = \(e: React\.FormEvent\) => \{.*?  \};\n"""
new_handleSubmit = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val < 100) {
      showError('Minimum deposit amount is ₹100');
      return;
    }
    
    try {
      const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      await requestDeposit(val, orderId);

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          order_id: orderId,
          redirect_url: window.location.origin + '/wallet?order_id=' + orderId
        })
      });
      
      const data = await res.json();
      if (data.status === true || data.payment_url || data.url) {
        window.location.href = data.payment_url || data.url;
      } else {
        showError(data.message || 'Payment gateway configuration error');
      }
    } catch (err) {
      showError('Failed to initiate payment. Please try again.');
    }
  };
"""

content = re.sub(old_handleSubmit, new_handleSubmit, content, flags=re.DOTALL)

# Now, we should also remove the onClick handler from the button and just let it be a submit button
old_btn = r"""                    <button
                      type="button"
                      onClick=\{async \(\) => \{.*?                      \}\}
                      className="w-full py-3\.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Pay via RupayEx Gateway
                    </button>"""

new_btn = """                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Pay via RupayEx Gateway
                    </button>"""

content = re.sub(old_btn, new_btn, content, flags=re.DOTALL)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("handleSubmit patched.")
