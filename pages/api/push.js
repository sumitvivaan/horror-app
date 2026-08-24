// pages/api/push.js - साया ऐप ऑटो-पुश एपीआई
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import webpush from 'web-push';

const publicKey = "BDIFBrmb92vnSOX52kfrlZroOkWmw2-a6dZ3Y8O0nl0mnNMw3S3u3Cue-cUs5q-HA36y6nrjG2VdmDJa6JzuRvM";
const privateKey = "XdLp8bELWMBjyHEHDW1bY0qi1oOJUtAKDrZ8F2PcEv4";

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
