import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# Replace the verify logic to save utr
old_verify = """           if (data.payment_status === 'SUCCESS') {
             batch.update(txDoc.ref, { status: 'completed' });
             const userRef = doc(db, 'users', currentUser.id);
             batch.update(userRef, { balance: increment(txData.amount) });
             await batch.commit();
             return true;
           }"""

new_verify = """           if (data.payment_status === 'SUCCESS') {
             const updateData: any = { status: 'completed' };
             if (data.utr) {
                 updateData.utr = data.utr;
             }
             batch.update(txDoc.ref, updateData);
             const userRef = doc(db, 'users', currentUser.id);
             batch.update(userRef, { balance: increment(txData.amount) });
             await batch.commit();
             return true;
           }"""

content = content.replace(old_verify, new_verify)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store updated with UTR save.")
