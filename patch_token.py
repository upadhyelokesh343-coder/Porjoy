import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the wrong token
content = content.replace("const RUPAYEX_API_TOKEN = 'ba2925e8af7a2cea9dc97d0f7ac540';", "const RUPAYEX_API_TOKEN = 'ba2925e8af7a2cee9dc97de70f7ac540';")

with open('server.ts', 'w') as f:
    f.write(content)

print("Token patched successfully.")
