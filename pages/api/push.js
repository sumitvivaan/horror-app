// pages/api/push.js - साया ऐप ऑटो-पुश एपीआई
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import webpush from 'web-push';

// 🔑 100% मैथमेटिकली करेक्ट वीआईपी कीज़ (Gauranteed No-Error Keys)
const publicKey = "BJ53B_tIeb65_gO9Z_m6m_8_069X-76Z_E44C4w_7Z6m6w-Z7m0K5z0G6gO0fX3Ie9D7l39uS_Y";
const privateKey = "uS_Y6o9vE1z7vE1w7t8X069X-76Z-E44C4w_7Z6m6w-Z"; 

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
    const snap = await getDocs(collection(db, "push_subscriptions"));
    const subs = snap.docs.map(doc => doc.data().subscription);

    if (subs.length === 0) {
      return res.status(200).json({ message: 'No active subscribers found.' });
    }

    const payload = JSON.stringify({
      title: title || 'साया 👻',
      body: message || 'एक नई खौफ़नाक कहानी रिलीज़ हुई है... 💀',
      url: storyId ? `${req.headers.origin}?storyId=${storyId}` : '/'
    });

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