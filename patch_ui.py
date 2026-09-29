import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Make sure we use the right response key
content = content.replace("data.payment_url", "data.payment_url || data.url")

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("UI patched successfully.")
