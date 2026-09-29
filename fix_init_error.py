import re

with open('src/pages/Wallet.tsx', 'r') as f:
    lines = f.readlines()

# find lines 84-91
effect_lines = lines[83:91]
# delete them
del lines[83:91]

# insert them after the state declarations (find "const [isAppWrapper" -> line 114 roughly after deletion)
for i, line in enumerate(lines):
    if "const [isAppWrapper" in line:
        insert_idx = i + 1
        break

lines = lines[:insert_idx] + ["\n"] + effect_lines + ["\n"] + lines[insert_idx:]

with open('src/pages/Wallet.tsx', 'w') as f:
    f.writelines(lines)

print("Fixed initialization error.")
