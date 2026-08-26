import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps.length) return;
  const pk = process.env.FIREBASE_PRIVATE_KEY || '';
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk.replace(/\\n/g, '\n')
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initAdmin();
    const db = admin.firestore();
    const { paymentId, type, uid, phone, storyId } = req.body || {};

    if (!paymentId || !uid) {
      return res.status(400).json({ error: 'Payment ID missing' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Server payment key missing' });
    }

    const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/payments/' + paymentId, {
      headers: { Authorization: 'Basic ' + auth }
    });
    const pay = await rzpRes.json();

    if (!rzpRes.ok || pay.status !== 'captured') {
      return res.status(400).json({ error: 'Payment verified nahi hui. Pass nahi lagega.' });
    }

    const usedRef = db.collection('premium_payments').doc(pay.id);
    const usedSnap = await usedRef.get();

    if (type === 'monthly') {
      if (pay.amount !== 9900) {
        return res.status(400).json({ error: 'Amount match nahi kiya' });
      }
      const mob = String(phone || '').replace(/\D/g, '').slice(-10);
      if (mob.length !== 10) {
        return res.status(400).json({ error: 'Sahi 10 digit number bhejo' });
      }
      if (usedSnap.exists) {
        const old = usedSnap.data() || {};
        if (old.phone && old.phone !== mob) {
          return res.status(400).json({ error: 'Ye payment pehle use ho chuki hai' });
        }
      }

      const exp = Date.now() + 30 * 24 * 3600 * 1000;
      await db.collection('premium_passes').doc(uid).set({
        exp,
        phone: mob,
        paymentId: pay.id,
        type: 'monthly',
        createdAt: Date.now()
      }, { merge: true });
      await db.collection('premium_phones').doc(mob).set({
        exp,
        uid,
        paymentId: pay.id,
        createdAt: Date.now()
      }, { merge: true });
      await usedRef.set({ phone: mob, uid, type: 'monthly', at: Date.now() }, { merge: true });

      return res.json({ success: true, exp, days: 30 });
    }

    if (type === 'story') {
      if (!storyId) return res.status(400).json({ error: 'Story missing' });
      const st = await db.collection('stories').doc(storyId).get();
      if (!st.exists) return res.status(400).json({ error: 'Story nahi mili' });
      const price = parseInt(st.data().price || 0, 10);
      if (!price || pay.amount !== price * 100) {
        return res.status(400).json({ error: 'Amount match nahi kiya' });
      }
      if (usedSnap.exists) {
        return res.status(400).json({ error: 'Ye payment pehle use ho chuki hai' });
      }

      const passRef = db.collection('premium_passes').doc(uid);
      const prev = await passRef.get();
      const unlocked = Array.from(new Set([].concat((prev.exists && prev.data().unlocked) || [], [storyId])));
      await passRef.set({
        unlocked,
        lastPaymentId: pay.id,
        updatedAt: Date.now()
      }, { merge: true });
      await usedRef.set({ uid, type: 'story', storyId, at: Date.now() }, { merge: true });

      return res.json({ success: true, unlocked });
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
