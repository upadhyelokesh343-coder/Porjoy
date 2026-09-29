import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

old_payout = """                  if (data.status === true || data.status === 'success' || data.message === 'Payout Initiated' || data.success) {
                    await requestWithdraw(amt, details + " [RupayEx Payout]");
                    setSuccessDetails({ amount: amt, method: transferType });"""

new_payout = """                  if (data.status === true || data.status === 'success' || data.message === 'Payout Initiated' || data.success) {
                    const payoutId = data.data?.payout_id || data.payout_id || data.utr;
                    await requestWithdraw(amt, details + " [RupayEx Payout]", payoutId);
                    setSuccessDetails({ amount: amt, method: transferType });"""

content = content.replace(old_payout, new_payout)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Patched Wallet payout")
