import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# 1. Update the store import
if 'verifyRupayExDeposit' not in content:
    content = content.replace("requestDeposit, requestWithdraw", "requestDeposit, requestWithdraw, verifyRupayExDeposit")

# 2. Add useEffect to verify deposit
verify_effect = """
  useEffect(() => {
    const checkDeposit = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id') || urlParams.get('orderId');
      
      if (orderId && currentUser) {
        // Clean URL to prevent re-triggering
        window.history.replaceState({}, document.title, window.location.pathname);
        
        try {
          const success = await verifyRupayExDeposit(orderId);
          if (success) {
            setSuccessMsg("Payment verified! ₹ added to your wallet.");
            setTimeout(() => setSuccessMsg(null), 4000);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkDeposit();
  }, [currentUser]);

"""

if 'checkDeposit = async' not in content:
    # Find a good place to insert the useEffect, like after the existing `useEffect` for timer
    content = content.replace("useEffect(() => {\n    if (!timerActive || timeLeft <= 0) return;", verify_effect + "  useEffect(() => {\n    if (!timerActive || timeLeft <= 0) return;")


# 3. Update onClick to save pending deposit
old_create = """                          const res = await fetch('/api/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: val,
                              order_id: orderId,
                              redirect_url: window.location.origin + '/wallet'
                            })
                          });"""

new_create = """                          // Save pending transaction BEFORE redirecting
                          await requestDeposit(val, orderId);

                          const res = await fetch('/api/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: val,
                              order_id: orderId,
                              redirect_url: window.location.origin + '/wallet?order_id=' + orderId
                            })
                          });"""

content = content.replace(old_create, new_create)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Wallet patched for verify.")
