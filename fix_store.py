import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# 1. Put the type definition back
bad_impl = """  verifyRupayExDeposit: async (orderId) => {
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
  },"""

content = content.replace(bad_impl, "  requestDeposit: (amount: number, reference: string, paymentAmount?: number) => Promise<void>;\n  verifyRupayExDeposit: (orderId: string) => Promise<boolean>;")

# 2. Add the real implementation to the bottom of the file (before the `}));`)
real_impl = """
  verifyRupayExDeposit: async (orderId) => {
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
"""

content = content.replace("  requestDeposit: async (amount, reference, paymentAmount) => {", real_impl + "  requestDeposit: async (amount, reference, paymentAmount) => {")

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store fixed.")
