import re

with open('server.ts', 'r') as f:
    content = f.read()

new_route = """
  // Check Order Route
  app.get("/api/check-order", async (req, res) => {
    try {
      const { order_id } = req.query;
      const response = await fetch(`https://rupayex.net/api/order-status?user_token=${RUPAYEX_API_TOKEN}&order_id=${order_id}`);
      const data = await response.text();
      try {
         res.json(JSON.parse(data));
      } catch(e) {
         res.status(200).send(data);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payout Route
"""

content = content.replace("  // Payout Route", new_route)

with open('server.ts', 'w') as f:
    f.write(content)

print("Server patched with check-order.")
