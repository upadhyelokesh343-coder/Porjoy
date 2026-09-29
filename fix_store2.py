import re

with open('src/store.ts', 'r') as f:
    content = f.read()

# The issue is on line 467. It seems the type definition was placed inside the object by mistake because of a bad string replacement earlier.
# Let's clean it up.
# First, let's remove the bad type definition
bad_str = """  requestDeposit: (amount: number, reference: string, paymentAmount?: number) => Promise<void>;
  verifyRupayExDeposit: (orderId: string) => Promise<boolean>;"""

if bad_str in content:
    content = content.replace(bad_str, "")

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store fixed 2.")
