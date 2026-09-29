import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# Add verifyRupayExDeposit definition
content = content.replace("requestDeposit: (amount: number, reference: string, paymentAmount?: number) => Promise<void>;", 
"requestDeposit: (amount: number, reference: string, paymentAmount?: number) => Promise<void>;\n  verifyRupayExDeposit: (orderId: string) => Promise<boolean>;")

# Add verifyRupayExDeposit implementation
verify_fn = """  verifyRupayExDeposit: async (orderId) => {
    try {
      const res = await fetch(`/api/check-order?order_id=${orderId}`);
      const data = await res.json();
      
      if (data.status === true && data.payment_status === 'SUCCESS') {
        const { currentUser } = get();
        if (!currentUser) return false;
        
        // Find pending transaction
        const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.id), where('reference', '==', orderId), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
           const txDoc = snap.docs[0];
           const txData = txDoc.data();
           
           const batch = writeBatch(db);
           batch.update(txDoc.ref, { status: 'completed' });
           
           const userRef = doc(db, 'users', currentUser.id);
           batch.update(userRef, { balance: increment(txData.amount) });
           
           await batch.commit();
           return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  requestDeposit:"""

content = content.replace("  requestDeposit:", verify_fn)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store patched with verifyRupayExDeposit.")
