import re

with open('src/store.ts', 'r') as f:
    content = f.read()

old_func = """  requestWithdraw: async (amount, reference) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.balance < amount) return;

    // Deduct balance immediately
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, { balance: currentUser.balance - amount });
    
    const txId = generateId();
    await setDoc(doc(db, 'transactions', txId), {
      userId: currentUser.id,
      type: 'withdraw',
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      reference,
    });
  },"""

new_func = """  requestWithdraw: async (amount, reference, utr) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.balance < amount) return;

    // Deduct balance immediately
    const userRef = doc(db, 'users', currentUser.id);
    await updateDoc(userRef, { balance: currentUser.balance - amount });
    
    const txId = generateId();
    const txData: any = {
      userId: currentUser.id,
      type: 'withdraw',
      amount,
      status: 'pending',
      date: new Date().toISOString(),
      reference,
    };
    if (utr) {
      txData.utr = utr;
    }
    await setDoc(doc(db, 'transactions', txId), txData);
  },"""

content = content.replace(old_func, new_func)

# Also update the type signature
old_sig = "requestWithdraw: (amount: number, reference: string) => Promise<void>;"
new_sig = "requestWithdraw: (amount: number, reference: string, utr?: string) => Promise<void>;"
content = content.replace(old_sig, new_sig)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Patched store.ts requestWithdraw")
