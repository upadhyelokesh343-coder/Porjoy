import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Remove the useEffect from the top
effect_match = re.search(r'  useEffect\(\(\) => \{\n    const checkDeposit = async \(\) => \{.*?  \}, \[currentUser\]\);\n', content, re.DOTALL)
if effect_match:
    effect_str = effect_match.group(0)
    content = content.replace(effect_str, "")
    
    # Insert it right after `const hasDeposited = ...`
    insert_point = "  const hasDeposited = transactions.some(t => t.type === 'deposit' && t.status === 'approved');\n"
    content = content.replace(insert_point, insert_point + "\n" + effect_str)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Fixed the useEffect placement.")
