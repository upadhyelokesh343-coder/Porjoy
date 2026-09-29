import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# We need to replace the try-catch block inside the Transfer Money Modal form submit
# The block starts at `                try {\n                  await requestWithdraw(amt, details);`

old_try_catch = """                try {
                  await requestWithdraw(amt, details);
                  setSuccessDetails({ amount: amt, method: transferType });
                  setIsTransferModalOpen(false);
                  setIsSuccessModalOpen(true);
                } catch (err: any) {
                  showError(err?.message || 'Transfer failed.');
                }"""

new_try_catch = """                try {
                  const res = await fetch('/api/payout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: amt,
                      upi_id: transferType === 'upi' ? transferUpiId.trim() : undefined,
                      account_no: transferType === 'bank' ? transferAccountNo.trim() : undefined,
                      ifsc: transferType === 'bank' ? transferIfsc.trim() : undefined,
                      bank_name: transferType === 'bank' ? transferBankName.trim() : undefined
                    })
                  });
                  
                  const data = await res.json();
                  
                  if (data.status === true || data.status === 'success' || data.message === 'Payout Initiated' || data.success) {
                    await requestWithdraw(amt, details + " [RupayEx Payout]");
                    setSuccessDetails({ amount: amt, method: transferType });
                    setIsTransferModalOpen(false);
                    setIsSuccessModalOpen(true);
                  } else {
                    showError(data.message || 'Payout failed. Please try again.');
                  }
                } catch (err: any) {
                  showError(err?.message || 'Transfer failed.');
                }"""

content = content.replace(old_try_catch, new_try_catch)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Withdraw patch applied successfully.")
