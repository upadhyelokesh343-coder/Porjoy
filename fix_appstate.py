import re

with open('src/store.ts', 'r') as f:
    content = f.read()

content = content.replace(
"  requestWithdraw: (amount: number, reference: string, utr?: string) => Promise<void>;",
"""  requestDeposit: (amount: number, reference: string, paymentAmount?: number) => Promise<void>;
  verifyRupayExDeposit: (orderId: string) => Promise<boolean>;
  requestWithdraw: (amount: number, reference: string, utr?: string) => Promise<void>;"""
)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Fixed AppState")
