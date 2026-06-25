const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = 3005;

// Ganti nilai ini dengan "Signing Secret (HMAC)" dari dashboard Kiosk
// Pastikan diawali dengan "whsec_"
const KIOSK_SIGNING_SECRET = "whsec_-UMlDISGwD3dD8CS9WutN9nGP3v7SWdL";

// Konfigurasi khusus:
// Agar tanda tangan bisa divalidasi dengan benar, kita harus menghitung hash 
// dari body mentah (raw buffer) SEBELUM di-parsing oleh Express.
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post('/webhook', (req, res) => {
  console.log('\n======================================');
  console.log(`[${new Date().toISOString()}] Menerima Webhook!`);

  const signatureHeader = req.headers['kiosk-signature'];

  if (!signatureHeader) {
    console.log("❌ [DITOLAK] Header 'Kiosk-Signature' tidak ditemukan.");
    return res.status(401).send("Missing signature");
  }

  try {
    // 1. Ekstrak timestamp (t) dan hash (v1) dari header
    const parts = signatureHeader.split(',');
    const tPart = parts.find(p => p.startsWith('t='));
    const v1Part = parts.find(p => p.startsWith('v1='));

    if (!tPart || !v1Part) {
      console.log("❌ [DITOLAK] Format 'Kiosk-Signature' tidak valid.");
      return res.status(401).send("Invalid signature format");
    }

    const t = tPart.split('=')[1];
    const v1 = v1Part.split('=')[1];

    // 2. Hitung ulang hash dengan Signing Secret
    const payloadString = req.rawBody.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', KIOSK_SIGNING_SECRET)
      .update(`${t}.${payloadString}`)
      .digest('hex');

    // 3. Bandingkan hash
    if (v1 === expectedSignature) {
      console.log("✅ [LULUS] Tanda tangan HMAC Valid!");
      console.log("📦 Payload Data:", req.body);

      res.status(200).send("Webhook received successfully");
    } else {
      console.log("❌ [GAGAL] Tanda tangan tidak cocok. Kemungkinan data dimanipulasi.");
      console.log(`   Expected: ${expectedSignature}`);
      console.log(`   Received: ${v1}`);
      res.status(400).send("Bad Signature");
    }
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat memverifikasi webhook:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Program Tester Webhook berjalan di http://localhost:${PORT}`);
  console.log(`👉 Destination URL untuk Kiosk: http://localhost:${PORT}/webhook`);
});
