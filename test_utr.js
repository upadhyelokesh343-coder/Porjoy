fetch('https://rupayex.net/api/order-status?user_token=ba2925e8af7a2cee9dc97de70f7ac540&utr=123456789012').then(r => r.json()).then(console.log).catch(console.error);
