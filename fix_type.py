import re
with open('src/types.ts', 'r') as f:
    content = f.read()
    
# Add utr to Transaction interface
if 'utr?: string;' not in content:
    content = content.replace('reference?: string;', 'reference?: string;\n  utr?: string;')
    with open('src/types.ts', 'w') as f:
        f.write(content)
print("Fixed types")
