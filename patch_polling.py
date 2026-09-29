import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

polling_effect = """
  // Poll pending transactions
  useEffect(() => {
    let intervalId: any;
    
    const checkPending = async () => {
      const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
      
      for (const tx of pendingDeposits) {
        if (tx.reference && tx.reference.startsWith('ORD_')) {
          try {
            const success = await verifyRupayExDeposit(tx.reference);
            if (success) {
               setSuccessMsg(`Payment of ₹${tx.amount} verified and added to wallet!`);
               setTimeout(() => setSuccessMsg(null), 5000);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    if (transactions.some(t => t.type === 'deposit' && t.status === 'pending')) {
      checkPending();
      intervalId = setInterval(checkPending, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transactions, verifyRupayExDeposit]);
"""

# Place it after the checkDeposit effect
insert_point = "  }, [currentUser]);"
content = content.replace(insert_point, insert_point + "\n" + polling_effect)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Polling added.")
