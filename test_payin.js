fetch('http://localhost:3000/api/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1500, order_id: '12345678', redirect_url: 'https://yoursite.com/callback' })
}).then(res => res.text()).then(console.log);
