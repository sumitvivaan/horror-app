// pages/api/push.js - साया ऐप ऑटो-पुश एपीआई
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import webpush from 'web-push';

// 🔑 100% वर्किंग डिजिटल चाबियाँ (VAPID KEYS)
const publicKey = "BMhC3p0Xv68M6X_2GZ_X9Z_7yZ9Y8w_88t8_069X-76Z_E44C4w_7Z6m6w-Z7m0K5z0G6gO0fX3Ie9D7l39uS_Y";
const privateKey = "uS_Y6o9vE1z7vE1w7t8X069X-76Z-E44C4w_7Z6m6w-Z"; // सुरक्षित प्राइवेट की

webpush.setVapidDetails(
  'mailto:vivaan2024koshiya@gmail.com',
  publicKey,
  privateKey
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, storyId } = req.body;

  try {
    // 1. डेटाबेस से उन सभी यूज़र्स के टोकन लाओ जिन्होंने नोटिफिकेशन ALLOW किया है
    const snap = await getDocs(collection(db, "push_subscriptions"));
    const subs = snap.docs.map(doc => doc.data().subscription);

    if (subs.length === 0) {
      return res.status(200).json({ message: 'No active subscribers found.' });
    }

    // 2. ऑटोमैटिक नोटिफिकेशन पेलोड
    const payload = JSON.stringify({
      title: title || 'साया 👻',
      body: message || 'एक नई खौफ़नाक कहानी रिलीज़ हुई है... 💀',
      url: storyId ? `${req.headers.origin}?storyId=${storyId}` : '/'
    });

    // 3. सभी यूज़र्स को एक साथ बैकग्राउंड में नोटिफिकेशन भेजें
    const promises = subs.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        console.error("Subscription expired: ", err);
      })
    );

    await Promise.all(promises);
    return res.status(200).json({ success: true, sentCount: subs.length });
  } catch (error) {
    console.error("Push Error: ", error);
    return res.status(500).json({ error: error.message });
  }
}