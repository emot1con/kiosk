const express = require('express');
const crypto = require('crypto');

async function run() {
  const beUrl = 'http://localhost:3001';
  console.log('Testing Kiosk Webhook Signature...');

  // Start a local server to receive the webhook
  const app = express();
  let server;
  let receivedSignature = null;
  let rawBodyBuffer = null;
  
  app.use(express.json({
    verify: (req, res, buf) => {
      rawBodyBuffer = buf;
    }
  }));

  app.post('/webhook-receiver', (req, res) => {
    receivedSignature = req.headers['kiosk-signature'];
    console.log('\n--- Webhook Received! ---');
    console.log('Headers:', req.headers);
    console.log('Signature Header:', receivedSignature);
    res.status(200).send('OK');
  });

  await new Promise(resolve => {
    server = app.listen(9998, () => {
      console.log('Webhook receiver listening on port 9998');
      resolve();
    });
  });

  try {
    // 1. Register a new user
    const regRes = await fetch(`${beUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_sig@kiosk.dev',
        password: 'password123',
        name: 'Test Sig User',
      })
    });
    
    // 2. Login
    const loginRes = await fetch(`${beUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_sig@kiosk.dev',
        password: 'password123',
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // 3. Create endpoint pointing to our local server
    console.log('\nCreating endpoint...');
    const epRes = await fetch(`${beUrl}/endpoints`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Signature Test Endpoint',
        destinationUrl: 'http://localhost:9998/webhook-receiver',
      })
    });
    const endpoint = await epRes.json();
    console.log(`Endpoint created. IncomingKey: ${endpoint.incomingKey}`);
    console.log(`Signing Secret generated: ${endpoint.signingSecret}`);

    // 4. Trigger incoming webhook
    console.log('\nTriggering incoming webhook...');
    const payload = {
      event: 'user.created',
      userId: 123
    };
    await fetch(`${beUrl}/incoming/${endpoint.incomingKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Test/1.0' },
      body: JSON.stringify(payload)
    });

    // Wait a couple seconds for delivery
    console.log('Waiting for delivery worker...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!receivedSignature) {
      throw new Error('Did not receive webhook or signature header missing!');
    }

    // 5. Verify the signature
    console.log('\nVerifying signature...');
    const parts = receivedSignature.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));
    
    if (!tPart || !v1Part) {
      throw new Error('Signature format invalid (missing t= or v1=)');
    }

    const timestamp = tPart.split('=')[1];
    const signature = v1Part.split('=')[1];

    const payloadString = rawBodyBuffer.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', endpoint.signingSecret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');

    console.log(`Received Signature: ${signature}`);
    console.log(`Expected Signature: ${expectedSignature}`);

    if (signature === expectedSignature) {
      console.log('✅ SUCCESS: Signature matches perfectly!');
    } else {
      console.log('❌ FAILED: Signature mismatch!');
    }

  } catch (err) {
    console.error('Test failed with error:', err.message);
  } finally {
    server.close();
  }
}

run();
