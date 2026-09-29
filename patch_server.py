import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the create-order endpoint payload 
old_create = """      const formData = new URLSearchParams();
      formData.append('user_token', RUPAYEX_API_TOKEN);
      formData.append('amount', amount.toString());
      formData.append('order_id', order_id);
      formData.append('redirect_url', redirect_url);"""

new_create = """      const formData = new URLSearchParams();
      formData.append('amount', amount.toString());
      formData.append('order_id', order_id);
      formData.append('redirect_url', redirect_url);"""

content = content.replace(old_create, new_create)

# Replace the create payout token logic if required
old_payout = """      const formData = new URLSearchParams();
      formData.append('user_token', RUPAYEX_API_TOKEN);"""

new_payout = """      const formData = new URLSearchParams();"""

content = content.replace(old_payout, new_payout)

with open('server.ts', 'w') as f:
    f.write(content)

print("Server patched successfully.")
