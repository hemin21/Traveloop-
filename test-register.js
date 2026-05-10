const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `testuser_${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    const json = await res.json();
    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('Network Error:', e.message);
  }
}
test();
