import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

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

if "const checkDeposit = async () => {" not in content:
    content = content.replace("export default function Wallet() {", "export default function Wallet() {" + verify_effect)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Effect added.")
