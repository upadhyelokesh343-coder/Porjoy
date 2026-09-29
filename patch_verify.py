import re

with open('src/store.ts', 'r') as f:
    content = f.read()

old_verify = """      if (data.status === true && data.payment_status === 'SUCCESS') {
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
      return false;"""

new_verify = """      if (data.status === true) {
        const { currentUser } = get();
        if (!currentUser) return false;
        
        const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.id), where('reference', '==', orderId), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
           const txDoc = snap.docs[0];
           const txData = txDoc.data();
           const batch = writeBatch(db);
           
           if (data.payment_status === 'SUCCESS') {
             batch.update(txDoc.ref, { status: 'completed' });
             const userRef = doc(db, 'users', currentUser.id);
             batch.update(userRef, { balance: increment(txData.amount) });
             await batch.commit();
             return true;
           } else if (data.payment_status === 'FAILURE') {
             batch.update(txDoc.ref, { status: 'failed' });
             await batch.commit();
             return false;
           }
        }
      }
      return false;"""

content = content.replace(old_verify, new_verify)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store updated with FAILURE handling.")
