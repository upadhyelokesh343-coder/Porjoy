const formData = new URLSearchParams();
formData.append('amount', '100');
formData.append('order_id', 'test12345');
formData.append('utr', '123456789012');
fetch('https://rupayex.net/api/create-order', {
  method: 'POST',
  headers: { 'X-Api-Token': 'ba2925e8af7a2cee9dc97de70f7ac540', 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData
}).then(r => r.text()).then(console.log).catch(console.error);
