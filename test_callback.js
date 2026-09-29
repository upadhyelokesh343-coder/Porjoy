const RUPAYEX_API_TOKEN = 'ba2925e8af7a2cee9dc97de70f7ac540';
const order_id = '12345678';
fetch(`https://rupayex.net/api/order-status?user_token=${RUPAYEX_API_TOKEN}&order_id=${order_id}`).then(r => r.json()).then(console.log);
