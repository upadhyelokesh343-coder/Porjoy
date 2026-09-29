import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Auto close effect for isSuccessModalOpen
auto_close_effect = """
  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);
"""

# Place it after checkDeposit effect
insert_point = "  }, [transactions, verifyRupayExDeposit]);"
content = content.replace(insert_point, insert_point + "\n" + auto_close_effect)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Modal auto-close added.")
