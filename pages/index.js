import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db, auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query, increment } from 'firebase/firestore';

const ADMIN_EMAIL = "vivaan2024koshiya@gmail.com";
const CLOUD_NAME = "wlse6ksh";
const UPLOAD_PRESET = "wlse6ksh";
const RAZORPAY_KEY = "rzp_test_TSLL3jml0siRz4";
const AMBIENCE_URL = "https://res.cloudinary.com/zyexm5wm/video/upload/v1787307374/simplesound-horror-trailer-443327.mp3";
const VAPID_PUBLIC_KEY = "BDIFBrmb92vnSOX52kfrlZroOkWmw2-a6dZ3Y8O0nl0mnNMw3S3u3Cue-cUs5q-HA36y6nrjG2VdmDJa6JzuRvM";

const CATEGORIES = ['चुड़ैल', 'हवेली', 'श्मशान', 'आपबीती', 'जंगल', 'अन्य'];

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

const isNew = (s) => s.createdAt && (Date.now() - s.createdAt) < 2 * 24 * 3600 * 1000;

const hasNotifSupport = () => {
  try { return typeof window !== 'undefined' && 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator; } catch (e) { return false; }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Home() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [poster, setPoster] = useState('');
  const [audio, setAudio] = useState('');
  const [price, setPrice] = useState('0');
  const [storyLang, setStoryLang] = useState('hindi');
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState('');
  const [tab, setTab] = useState('audio');
  const [lang, setLang] = useState('hindi');
  const [theme, setTheme] = useState('dark');
  const [readingStory, setReadingStory] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [unlocked, setUnlocked] = useState([]);
  const [offerLeft, setOfferLeft] = useState('');
  const [showWheel, setShowWheel] = useState(false);
  const [wheelDeg, setWheelDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wheelMsg, setWheelMsg] = useState('');
  const [ambOn, setAmbOn] = useState(false);
  const [fearVotes, setFearVotes] = useState({});
  const [sharesCnt, setSharesCnt] = useState({});
  const [heroIdx, setHeroIdx] = useState(0);
  const [installEvt, setInstallEvt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [subName, setSubName] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [subText, setSubText] = useState('');
  const [subSending, setSubSending] = useState(false);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [showPending, setShowPending] = useState(false);
  const [comments, setComments] = useState([]);
  const [cmtName, setCmtName] = useState('');
  const [cmtText, setCmtText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [cmtSending, setCmtSending] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [storyCat, setStoryCat] = useState('अन्य');
  const [hasPass, setHasPass] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [debugSW, setDebugSW] = useState("Checking...");
  const [debugPermission, setDebugPermission] = useState("Checking...");
  const [debugTokenCount, setDebugPermissionCount] = useState(0);

  const audioRef = useRef(null);
  const ambRef = useRef(null);
  const touchX = useRef(0);
  const readingRef = useRef(null);

  useEffect(() => {
    loadStories();
    onAuthStateChanged(auth, (u) => { setIsAdmin(!!u && u.email === ADMIN_EMAIL); });
    try { setUnlocked(JSON.parse(localStorage.getItem('unlocked') || '[]')); } catch (e) {}
    try { setHasPass(localStorage.getItem('premiumPass') === 'yes'); } catch (e) {}
    try { setFearVotes(JSON.parse(localStorage.getItem('fearVotes') || '{}')); } catch (e) {}
    try { setSharesCnt(JSON.parse(localStorage.getItem('sharesCnt') || '{}')); } catch (e) {}
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
    } catch (e) {}
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(s);

    const wTimer = setTimeout(() => setShowWelcome(true), 1500);
    const wHide = setTimeout(() => setShowWelcome(false), 8000);

    const notifOK = hasNotifSupport();
    if (notifOK) {
      try { setDebugPermission(Notification.permission); } catch (e) { setDebugPermission("unknown"); }
    } else {
      setDebugPermission("Not supported here (iOS Safari me Home Screen se kholo) ℹ️");
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setDebugSW("Active ✅");
        try {
          if (notifOK && Notification.permission === 'default') {
            setTimeout(() => { setShowPushBanner(true); }, 3500);
          }
        } catch (e) {}
      }).catch((err) => {
        setDebugSW("Failed: " + err.message);
      });
    } else {
      setDebugSW("Not supported ❌");
    }

    const fetchSubCount = async () => {
      try {
        const snap = await getDocs(collection(db, "push_subscriptions"));
        setDebugPermissionCount(snap.docs.length);
      } catch (err) {}
    };
    fetchSubCount();

    try {
      const params = new URLSearchParams(window.location.search);
      const sId = params.get('storyId');
      if (sId) {
        const fetchDirectStory = async () => {
          try {
            const q = query(collection(db, "stories"));
            const snap = await getDocs(q);
            const matched = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(st => st.id === sId);
            if (matched) openStory(matched);
          } catch (err) {}
        };
        fetchDirectStory();
      }
    } catch (e) {}

    const onPop = () => {
      if (readingRef.current) {
        try {
          const st = readingRef.current;
          if (audioRef.current && audioRef.current.currentTime > 5) {
            const saved = JSON.parse(localStorage.getItem('audioPos') || '{}');
            if (audioRef.current.currentTime < (audioRef.current.duration || 999999) - 10) {
              saved[st.id] = audioRef.current.currentTime;
            } else {
              delete saved[st.id];
            }
            localStorage.setItem('audioPos', JSON.stringify(saved));
          }
        } catch (e) {}
        readingRef.current = null;
        setReadingStory(null); setPlaying(false); setCurTime(0); setDuration(0);
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setInstallEvt(e); });
    const t = setInterval(() => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const diff = end - now;
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), sc = Math.floor((diff % 60000) / 1000);
      setOfferLeft(h + 'घं ' + m + 'मि ' + sc + 'से');
    }, 1000);
    const ht = setInterval(() => setHeroIdx(i => i + 1), 4000);
    return () => { clearInterval(t); clearInterval(ht); clearTimeout(wTimer); clearTimeout(wHide); window.removeEventListener('popstate', onPop); };
  }, []);

  const subscribePushNotification = async () => {
    setShowPushBanner(false);
    if (!hasNotifSupport()) {
      alert("📲 iPhone users: Pehle app ko Home Screen par Add karo (Share → Add to Home Screen), phir wahan se kholkar notification chalu karo!");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setDebugPermission(permission);
      if (permission !== 'granted') {
        alert("🔒 Notification allow nahi hua. Browser settings se allow kar sakte ho.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      await addDoc(collection(db, "push_subscriptions"), {
        subscription: JSON.parse(JSON.stringify(sub)),
        createdAt: Date.now()
      });
      alert("🎉 बधाई हो! खौफ़ के लाइव अलर्ट चालू हो गए! 👻");
      const snap = await getDocs(collection(db, "push_subscriptions"));
      setDebugPermissionCount(snap.docs.length);
    } catch (e) {
      alert("❌ Push error: " + e.message);
    }
  };

  const sendTestNotification = async () => {
    const tName = prompt("Notification का टाइटल:", "साया 👻");
    const tMsg = prompt("मैसेज:", "सुनसान हवेली का दरवाज़ा खुल गया है... 💀");
    if (!tName || !tMsg) return;
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tName, message: tMsg })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.sentCount} users ko notification bhej diya!`);
      } else {
        alert("ℹ️ " + (data.message || data.error || "Koi subscriber nahi mila."));
      }
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  const submitUserStory = async () => {
    if (!subName.trim() || !subTitle.trim() || !subText.trim()) return alert('Naam, Title aur Story - teeno likho!');
    if (subText.trim().length < 100) return alert('Story thodi lambi likho (kam se kam 100 akshar)!');
    setSubSending(true);
    try {
      await addDoc(collection(db, "submissions"), {
        writer: subName.trim(), title: subTitle.trim(), text: subText.trim(),
        createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN')
      });
      setSubName(''); setSubTitle(''); setSubText(''); setShowSubmit(false);
      alert('🎉 कहानी भेज दी गई! Admin check karke jald publish karega. Dhanyawad! 👻');
    } catch (e) { alert('Bhejne mein error: ' + e.message); }
    setSubSending(false);
  };

  const loadPending = async () => {
    try {
      const snap = await getDocs(query(collection(db, "submissions"), orderBy("createdAt", "desc")));
      setPendingSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setShowPending(true);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const approveSub = async (sub) => {
    try {
      const docRef = await addDoc(collection(db, "stories"), {
        title: sub.title, text: sub.text + '\n\n— ✍️ लेखक: ' + sub.writer,
        poster: '', audio: '', price: 0, lang: 'hindi', cat: 'आपबीती',
        views: 0, fearTotal: 0, fearCount: 0,
        createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN')
      });
      await deleteDoc(doc(db, "submissions", sub.id));
      setPendingSubs(prev => prev.filter(p => p.id !== sub.id));
      alert('✅ Approve! "' + sub.title + '" ab public hai!');
      try {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `🚨 नई कहानी: ${sub.title} 👻`,
            message: `लेखक ${sub.writer} की नई कहानी आई है। क्या अकेले सुन पाओगे? 💀`,
            storyId: docRef.id
          })
        });
      } catch (err) {}
      loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const rejectSub = async (id) => {
    if (!confirm('Pakka REJECT karna hai? Story delete ho jayegi!')) return;
    await deleteDoc(doc(db, "submissions", id));
    setPendingSubs(prev => prev.filter(p => p.id !== id));
  };

  const loadComments = async (storyId) => {
    try {
      const snap = await getDocs(query(collection(db, "comments"), orderBy("createdAt", "desc")));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.storyId === storyId));
    } catch (e) { setComments([]); }
  };

  const postComment = async () => {
    if (!isAdmin && !cmtName.trim()) return alert('Naam likho!');
    if (!cmtText.trim()) return alert('Comment likho!');
    setCmtSending(true);
    try {
      const isUserPremium = hasPass || (readingStory && unlocked.includes(readingStory.id));
      await addDoc(collection(db, "comments"), {
        storyId: readingStory.id,
        name: isAdmin ? '👑 Admin (साया)' : cmtName.trim(),
        text: cmtText.trim(),
        parentId: replyTo ? replyTo.id : null,
        createdAt: Date.now(),
        date: new Date().toLocaleDateString('hi-IN'),
        isVIP: !isAdmin && isUserPremium
      });
      setCmtText(''); setReplyTo(null);
      loadComments(readingStory.id);
    } catch (e) { alert('Comment error: ' + e.message); }
    setCmtSending(false);
  };

  const deleteComment = async (id) => {
    if (!confirm('Yeh comment delete karna hai?')) return;
    try {
      await deleteDoc(doc(db, "comments", id));
      for (const c of comments.filter(x => x.parentId === id)) {
        await deleteDoc(doc(db, "comments", c.id));
      }
      loadComments(readingStory.id);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const closeStory = () => {
    try {
      if (readingStory && audioRef.current && audioRef.current.currentTime > 5) {
        const saved = JSON.parse(localStorage.getItem('audioPos') || '{}');
        if (audioRef.current.currentTime < (audioRef.current.duration || 999999) - 10) {
          saved[readingStory.id] = audioRef.current.currentTime;
        } else {
          delete saved[readingStory.id];
        }
        localStorage.setItem('audioPos', JSON.stringify(saved));
      }
    } catch (e) {}
    if (readingRef.current) {
      readingRef.current = null;
      window.history.back();
    } else {
      setReadingStory(null); setPlaying(false); setCurTime(0); setDuration(0);
    }
  };
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (diff > 90 && touchX.current < 60) closeStory();
  };

  const installApp = () => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIos) { setShowIosGuide(true); return; }
    if (installEvt) {
      installEvt.prompt();
      installEvt.userChoice.then(() => setInstallEvt(null));
    } else {
      alert('App pehle se installed hai, ya browser ke menu (⋮) mein "Install app" / "Add to Home screen" dabao!');
    }
  };

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark';
    setTheme(nt);
    try { localStorage.setItem('theme', nt); } catch (e) {}
  };

  const loadStories = async () => {
    try {
      const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openStory = (story) => {
    setReadingStory(story);
    readingRef.current = story;
    window.history.pushState({ story: true }, '');
    loadComments(story.id);
    setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('audioPos') || '{}');
        if (saved[story.id] && saved[story.id] > 5 && audioRef.current) {
          audioRef.current.currentTime = saved[story.id];
          setCurTime(saved[story.id]);
        }
      } catch (e) {}
    }, 800);
    try {
      updateDoc(doc(db, "stories", story.id), { views: increment(1) });
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, views: (s.views || 0) + 1 } : s));
    } catch (e) {}
  };

  const handleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      if (res.user.email !== ADMIN_EMAIL) {
        alert('Yeh admin ka email nahi hai! ❌');
        await signOut(auth);
      } else { setShowLogin(false); setShowPanel(true); alert('Welcome Admin! ✅'); }
    } catch (e) { alert('Login error: ' + e.message); }
  };

  const clearForm = () => { setTitle(''); setText(''); setPoster(''); setAudio(''); setPrice('0'); setStoryLang('hindi'); setStoryCat('अन्य'); setEditId(null); };

  const convertToJpegBlob = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas failure"));
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error("Image render error"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file, kind) => {
    if (!file) return;
    if (file.size === 0) {
      alert("⚠️ Error: File 0 bytes hai! (iCloud files pehle download karo)");
      return;
    }
    setUploading(kind);
    try {
      const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
      let uploadBlob = file;
      let fileName = file.name || (kind === 'poster' ? 'image.jpg' : 'audio.mp3');

      if (kind === 'poster') {
        if (isIos || fileName.match(/\.(heic|png|webp)$/i)) {
          try {
            uploadBlob = await convertToJpegBlob(file);
            fileName = 'saaya_poster_' + Date.now() + '.jpg';
          } catch (err) {
            console.log("Canvas skipped: ", err);
          }
        }
      } else {
        if (isIos || !file.type || file.type === 'application/octet-stream') {
          let detectType = file.type || 'audio/mpeg';
          if (fileName.endsWith('.opus')) detectType = 'audio/ogg';
          uploadBlob = new Blob([file], { type: detectType });
        }
        const cleanExt = fileName.includes('.') ? fileName.split('.').pop() : 'mp3';
        fileName = `saaya_audio_${Date.now()}.${cleanExt}`;
      }

      const resourceType = kind === 'poster' ? 'image' : 'video';
      const fd = new FormData();
      fd.append('file', uploadBlob, fileName);
      fd.append('upload_preset', UPLOAD_PRESET);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
      const res = await fetch(uploadUrl, { method: 'POST', body: fd });
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Server response error: " + responseText.substring(0, 100));
      }
      if (res.ok && data.secure_url) {
        if (kind === 'poster') setPoster(data.secure_url);
        else setAudio(data.secure_url);
        alert((kind === 'poster' ? 'Poster' : 'Audio') + ' upload ho gaya! ✅');
      } else {
        const errMsg = data.error && data.error.message ? data.error.message : responseText;
        alert('❌ Error: ' + errMsg);
      }
    } catch (e) {
      alert('❌ Upload Error: ' + e.message);
    }
    setUploading('');
  };

  const saveStory = async () => {
    if (!title) return alert('Title toh likho!');
    if (!text && !audio) return alert('Story Text ya Audio - kuch toh dalo!');
    try {
      if (editId) {
        await updateDoc(doc(db, "stories", editId), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0, lang: storyLang, cat: storyCat });
        alert('Update ho gayi! ✏️');
      } else {
        const docRef = await addDoc(collection(db, "stories"), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0, lang: storyLang, cat: storyCat, views: 0, fearTotal: 0, fearCount: 0, createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN') });
        alert('Publish ho gayi! 🎃');
        try {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `🚨 नई कहानी: ${title} 👻`,
              message: `नई डरावनी कहानी आई है! क्या अकेले सुन पाओगे? 💀`,
              storyId: docRef.id
            })
          });
        } catch (pushErr) {}
      }
      clearForm(); loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const startEdit = (story) => {
    setEditId(story.id); setTitle(story.title || ''); setText(story.text || '');
    setPoster(story.poster || ''); setAudio(story.audio || ''); setPrice(String(story.price || 0));
    setStoryLang(story.lang || 'hindi');
    setStoryCat(story.cat || 'अन्य');
    setShowPanel(true);
  };

  const removeStory = async (id) => {
    if (!confirm('Pakka delete karna hai?')) return;
    await deleteDoc(doc(db, "stories", id));
    loadStories();
  };

  const isUnlocked = (story) => !story.price || story.price === 0 || hasPass || unlocked.includes(story.id) || isAdmin;

  const doUnlock = (id) => {
    const nu = [...unlocked, id];
    setUnlocked(nu);
    try { localStorage.setItem('unlocked', JSON.stringify(nu)); } catch (e) {}
  };

  const buyPass = () => {
    if (RAZORPAY_KEY.includes('YAHAN')) return alert('Razorpay Key abhi nahi dali gayi!');
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY, amount: 99 * 100, currency: 'INR',
      name: 'साया - Premium Pass 👑', description: 'सभी कहानियाँ हमेशा के लिए UNLOCK',
      handler: function () {
        setHasPass(true);
        try { localStorage.setItem('premiumPass', 'yes'); } catch (e) {}
        alert('👑 बधाई हो! आप PREMIUM MEMBER हो! 🎉');
      },
      theme: { color: '#cc0000' }
    });
    rzp.open();
  };

  const payStory = (story) => {
    if (RAZORPAY_KEY.includes('YAHAN')) return alert('Razorpay Key abhi nahi dali gayi!');
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY, amount: story.price * 100, currency: 'INR',
      name: 'साया - खौफ़ की कहानियाँ', description: story.title,
      handler: function () { doUnlock(story.id); alert('Payment ho gayi! Ab suno aur download karo 🎃'); },
      theme: { color: '#cc0000' }
    });
    rzp.open();
  };

  const shareUnlock = (story) => {
    const msg = '👻 "' + story.title + '" - darawani kahani suno/padho!\n\n' + window.location.origin + '\n\n🎧 Akele mat sunna...';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    const cnt = (sharesCnt[story.id] || 0) + 1;
    const ns = { ...sharesCnt, [story.id]: cnt };
    setSharesCnt(ns);
    try { localStorage.setItem('sharesCnt', JSON.stringify(ns)); } catch (e) {}
    if (cnt >= 5) { doUnlock(story.id); alert('🎉 5 shares पूरे! कहानी FREE unlock!'); }
  };

  const rateFear = async (story, n) => {
    if (fearVotes[story.id]) return alert('Aap pehle hi rate kar chuke ho! 💀');
    try {
      await updateDoc(doc(db, "stories", story.id), { fearTotal: increment(n), fearCount: increment(1) });
      const nv = { ...fearVotes, [story.id]: n };
      setFearVotes(nv);
      try { localStorage.setItem('fearVotes', JSON.stringify(nv)); } catch (e) {}
      const upd = s => ({ ...s, fearTotal: (s.fearTotal || 0) + n, fearCount: (s.fearCount || 0) + 1 });
      setStories(prev => prev.map(s => s.id === story.id ? upd(s) : s));
      setReadingStory(prev => prev && prev.id === story.id ? upd(prev) : prev);
    } catch (e) { alert('Rating error: ' + e.message); }
  };

  const fearPct = (s) => s.fearCount ? Math.round(((s.fearTotal || 0) / s.fearCount / 5) * 100) : 0;

  const spinWheel = () => {
    let last = 0;
    try { last = parseInt(localStorage.getItem('lastSpin') || '0'); } catch (e) {}
    if (Date.now() - last < 7 * 24 * 3600 * 1000) {
      const days = Math.ceil((7 * 24 * 3600 * 1000 - (Date.now() - last)) / (24 * 3600 * 1000));
      setWheelMsg('⏳ Is hafte ka spin ho chuka! ' + days + ' din baad aao 🎰');
      return;
    }
    if (spinning) return;
    setSpinning(true); setWheelMsg('');
    const idx = Math.floor(Math.random() * 6);
    const base = wheelDeg - (wheelDeg % 360);
    setWheelDeg(base + 360 * 6 + (360 - (idx * 60 + 30)));
    setTimeout(() => {
      setSpinning(false);
      try { localStorage.setItem('lastSpin', String(Date.now())); } catch (e) {}
      if (idx === 0 || idx === 2) {
        const lockedPaid = stories.filter(s => s.price > 0 && !unlocked.includes(s.id));
        if (lockedPaid.length === 0) { setWheelMsg('🎉 Jeet gaye! Par sab pehle se unlocked hai!'); return; }
        const w = lockedPaid[Math.floor(Math.random() * lockedPaid.length)];
        doUnlock(w.id);
        setWheelMsg('🎉 बधाई हो! "' + w.title + '" FREE unlock! 🎁');
      } else {
        setWheelMsg('😢 अगली बार किस्मत आज़माओ!');
      }
    }, 4300);
  };

  const toggleAmb = () => {
    if (!ambRef.current) { ambRef.current = new Audio(AMBIENCE_URL); ambRef.current.loop = true; ambRef.current.volume = 0.2; }
    if (ambOn) { ambRef.current.pause(); setAmbOn(false); }
    else { ambRef.current.play().catch(() => {}); setAmbOn(true); }
  };

  const downloadAudio = async (story) => {
    try {
      const res = await fetch(story.audio);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = story.title + '.mp3'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { window.open(story.audio, '_blank'); }
  };

  const downloadText = (story) => {
    const blob = new Blob([story.title + "\n\n" + story.text + "\n\n© साया"], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = story.title + '.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const shareStory = (story) => {
    const msg = '👻 "' + story.title + '" - darawani kahani suno/padho FREE!\n\n' + window.location.origin + '\n\n🎧 Akele mat sunna...';
    if (navigator.share) { navigator.share({ title: story.title, text: msg }).catch(() => {}); }
    else { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank'); }
  };

  const shareCardImg = async (story) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720; canvas.height = 960;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0d0305'; ctx.fillRect(0, 0, 720, 960);
      if (story.poster) {
        await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { ctx.drawImage(img, 0, 0, 720, 620); res(); };
          img.onerror = () => res();
          img.src = story.poster;
        });
      } else {
        ctx.fillStyle = '#1a0505'; ctx.fillRect(0, 0, 720, 620);
        ctx.font = '160px serif'; ctx.textAlign = 'center'; ctx.fillText('👻', 360, 360);
      }
      const gr = ctx.createLinearGradient(0, 350, 0, 960);
      gr.addColorStop(0, 'rgba(13,3,5,0)'); gr.addColorStop(0.4, 'rgba(13,3,5,0.9)'); gr.addColorStop(1, '#0d0305');
      ctx.fillStyle = gr; ctx.fillRect(0, 300, 720, 660);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Georgia';
      ctx.fillText(story.title.substring(0, 22), 360, 715);
      ctx.fillStyle = '#ee5555'; ctx.font = 'italic 27px Georgia';
      ctx.fillText('क्या तुम अकेले सुन पाओगे?', 360, 775);
      ctx.fillStyle = '#cc0000'; ctx.font = 'bold 58px Georgia';
      ctx.fillText('साया', 360, 860);
      ctx.fillStyle = '#885555'; ctx.font = '22px sans-serif';
      ctx.fillText(window.location.origin.replace('https://', ''), 360, 908);
      canvas.toBlob(async (blob) => {
        if (!blob) return alert('Card ban nahi paya!');
        const file = new File([blob], 'saaya-story.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: '👻 ' + story.title + ' - ' + window.location.origin }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'saaya-story.png'; a.click();
          URL.revokeObjectURL(url);
          alert('🖼️ Poster download ho gaya!');
        }
      });
    } catch (e) { alert('Card error: ' + e.message); }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      const p = a.play();
      if (p) p.then(() => setPlaying(true)).catch(() => alert('Audio load nahi hui!'));
      else setPlaying(true);
    }
  };

  const skip = (sec) => { if (audioRef.current) audioRef.current.currentTime += sec; };
  const onSeek = (e) => { const v = parseFloat(e.target.value); if (audioRef.current) audioRef.current.currentTime = v; setCurTime(v); };

  const dk = theme === 'dark';
  const C = {
    bg: dk ? '#0a0305' : '#f4e8e8',
    card: dk ? '#140808' : '#fff5f5',
    border: dk ? '#2a1515' : '#e0c0c0',
    text: dk ? '#fff' : '#220a0a',
    sub: dk ? '#888' : '#8a6262',
    nav: dk ? 'linear-gradient(180deg, rgba(10,3,5,0.98), rgba(10,3,5,0.85))' : 'linear-gradient(180deg, rgba(248,234,234,0.98), rgba(248,234,234,0.9))',
    navBorder: dk ? '#1a0a0a' : '#e5c5c5',
    footer: dk ? '#3a1515' : '#b58c8c'
  };

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#0a0505', color: 'white', border: '1px solid #441515', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' };
  const orgBtn = { backgroundColor: '#cc0000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

  const langStories = stories.filter(s => (s.lang || 'hindi') === lang)
    .filter(s => catFilter === 'all' || (s.cat || 'अन्य') === catFilter)
    .filter(s => !searchQ.trim() || s.title.toLowerCase().includes(searchQ.trim().toLowerCase()));
  const audioStories = langStories.filter(s => s.audio);
  const textStories = langStories.filter(s => s.text);
  const showList = tab === 'audio' ? audioStories : textStories;
  const heroList = langStories.filter(s => s.poster).slice(0, 5);
  const hero = heroList.length ? heroList[heroIdx % heroList.length] : null;
  const trending = [...langStories].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8);
  const newest = langStories.slice(0, 8);
  const blurBg = showLogin || (showPanel && isAdmin) || readingStory || showWheel || showIosGuide || showSubmit || showPending || showAdminMenu;
  const isEng = lang === 'english';

  const css = `
    @keyframes bounce1 { 0%,100%{height:8px} 50%{height:26px} }
    @keyframes bounce2 { 0%,100%{height:20px} 50%{height:6px} }
    @keyframes bounce3 { 0%,100%{height:12px} 50%{height:30px} }
    @keyframes glow { 0%,100%{text-shadow:0 0 15px rgba(200,0,0,0.6)} 50%{text-shadow:0 0 35px rgba(200,0,0,1)} }
    @keyframes wob { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
    @keyframes heroFade { from{opacity:0.4; transform:scale(1.04)} to{opacity:1; transform:scale(1)} }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    @keyframes pulseNew { 0%,100%{opacity:1} 50%{opacity:0.6} }
    @keyframes wlSlide { from{transform:translateY(-130%); opacity:0;} to{transform:translateY(0); opacity:1;} }
    @keyframes wlGhost { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
    .wlBox { animation: wlSlide 0.6s cubic-bezier(0.2,0.9,0.3,1.1) both; }
    .wlGhost { display:inline-block; animation: wlGhost 2s ease-in-out infinite; }
    .vbar { width:5px; background:#cc0000; border-radius:3px; }
    .playing .b1 { animation: bounce1 0.7s infinite; } .playing .b2 { animation: bounce2 0.5s infinite; }
    .playing .b3 { animation: bounce3 0.8s infinite; } .playing .b4 { animation: bounce2 0.6s infinite; }
    .playing .b5 { animation: bounce1 0.9s infinite; }
    .sayaTitle { animation: glow 3s infinite; }
    .wobble { display:inline-block; animation: wob 1.5s infinite; }
    .heroImg { animation: heroFade 0.8s ease; }
    .row { display:flex; overflow-x:auto; gap:12px; padding:12px 4px 18px; scrollbar-width:none; -ms-overflow-style:none; }
    .row::-webkit-scrollbar { display:none; }
    .card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .card:hover { transform: scale(1.06); box-shadow: 0 6px 30px rgba(200,0,0,0.4); z-index:2; }
    .card:hover img { filter: brightness(1.1); }
    .skel { background: linear-gradient(90deg,${dk ? '#140808 25%,#200a0a 50%,#140808' : '#e8d0d0 25%,#f5e3e3 50%,#e8d0d0'} 75%); background-size:800px 100%; animation: shimmer 1.3s infinite; border-radius:12px; }
    .newBadge { animation: pulseNew 1.5s infinite; }
    input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:5px; background:#3a1010; outline:none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#cc0000; cursor:pointer; box-shadow:0 0 10px rgba(200,0,0,0.9); }
    .frame { border: 4px solid #8b0000; border-radius: 14px; position: relative;
      background: linear-gradient(180deg, #2a0505 0%, #1a0303 50%, #3d0808 100%);
      box-shadow: 0 0 0 2px #6b1515, 0 0 0 6px #2a0a05, 0 0 60px rgba(200,0,0,0.25), inset 0 0 40px rgba(0,0,0,0.8); }
    .frame:before { content:'💀'; position:absolute; top:-24px; left:50%; transform:translateX(-50%);
      font-size:2.2rem; filter: drop-shadow(0 0 10px rgba(200,0,0,0.8)); }
    .frame .corner { position:absolute; font-size:1.1rem; opacity:0.9; }
    .skullBtn { background:none; border:none; font-size:1.7rem; cursor:pointer; filter:grayscale(1); transition: all 0.2s; }
    .rankNum { font-size:5.5rem; font-weight:900; color:transparent; -webkit-text-stroke: 2px #cc0000; font-family:sans-serif; line-height:1; opacity:0.85; }
    @keyframes batFly { 0%{ left:-60px; top:15%; transform:scaleX(1);} 45%{ top:8%; } 50%{ left:105%; transform:scaleX(1);} 51%{ transform:scaleX(-1);} 95%{ top:20%; } 100%{ left:-60px; top:15%; transform:scaleX(-1);} }
    .storyBat { position:fixed; font-size:1.8rem; z-index:101; pointer-events:none; animation: batFly 18s linear infinite; filter: drop-shadow(0 0 6px rgba(200,0,0,0.4)); }
    @keyframes spiderDrop { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(45px);} }
    .spider { position:fixed; top:0; right:12%; z-index:101; pointer-events:none; animation: spiderDrop 6s ease-in-out infinite; text-align:center; font-size:1.2rem; }
    .spider .thread { width:1px; height:60px; background:rgba(200,200,200,0.35); margin:0 auto; }
    @keyframes fogMove { 0%{ transform:translateX(-25%);} 100%{ transform:translateX(25%);} }
    .fog { position:fixed; bottom:-30px; left:-20%; width:140%; height:130px; z-index:101; pointer-events:none; background: radial-gradient(ellipse at center, rgba(150,80,80,0.13), transparent 70%); animation: fogMove 9s ease-in-out infinite alternate; }
    @keyframes darkPulse { 0%,100%{ box-shadow: inset 0 0 120px rgba(0,0,0,0.85);} 50%{ box-shadow: inset 0 0 200px rgba(0,0,0,0.97);} }
    .vignette { position:fixed; inset:0; z-index:99; pointer-events:none; animation: darkPulse 7s infinite; }
    @keyframes eyesBlink { 0%,88%,100%{opacity:0} 90%,96%{opacity:0.8} }
    .eyes { position:fixed; bottom:18%; left:6%; z-index:101; pointer-events:none; font-size:1rem; animation: eyesBlink 11s infinite; }
    .eyes2 { left:auto; right:8%; bottom:30%; animation-delay:5s; }
  `;

  const posterCard = (story, w) => (
    <div key={story.id} onClick={() => openStory(story)} className="card" style={{ minWidth: w, width: w, backgroundColor: C.card, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + C.border, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      {story.poster ? (
        <img src={story.poster} alt={story.title} style={{ width: '100%', height: '190px', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ height: '190px', background: 'linear-gradient(135deg, #1a0808, #330a0a)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem' }}>{story.audio ? '🔊' : '🎃'}</div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '25px 8px 6px' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{story.title}</h3>
        <p style={{ color: '#ee5555', margin: '3px 0 0', fontSize: '0.68rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
      </div>
      {isNew(story) && <span className="newBadge" style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>NEW</span>}
      {story.price > 0 && !isUnlocked(story) && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(200,0,0,0.95)', color: '#fff', borderRadius: '20px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
    </div>
  );

  return (
    <div style={{ backgroundColor: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.4s, color 0.4s' }}>
      <Head><title>साया - खौफ़ की हिंदी कहानियाँ</title></Head>
      <style>{css}</style>

      {showWelcome && (
        <div style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, width: '92%', maxWidth: '400px' }}>
          <div className="wlBox" style={{ background: 'linear-gradient(135deg, #1a0505, #2a0808)', border: '1px solid #cc0000', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 25px rgba(200,0,0,0.35)' }}>
            <span className="wlGhost" style={{ fontSize: '1.8rem' }}>👻</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#ee5555', margin: 0, fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>साया में आपका स्वागत है...</p>
              <p style={{ color: '#aa7777', margin: '2px 0 0', fontSize: '0.75rem' }}>आज की नई डरावनी कहानियाँ तैयार हैं 🌙</p>
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ backgroundColor: '#cc0000', color: '#fff', border: 'none', borderRadius: '15px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>🎧 सुनाओ!</button>
            <button onClick={() => setShowWelcome(false)} style={{ backgroundColor: 'transparent', color: '#886655', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0 2px' }}>✕</button>
          </div>
        </div>
      )}

      {showPushBanner && (
        <div style={{ background: 'linear-gradient(90deg, #cc0000, #660000)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontFamily: 'Georgia, serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>💀</span>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>नई खौफ़नाक कहानियों के लाइव अलर्ट चाहिए?</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={subscribePushNotification} style={{ backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '15px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}>हाँ, चालू करो! ✅</button>
            <button onClick={() => setShowPushBanner(false)} style={{ backgroundColor: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        </div>
      )}

      <div style={{ filter: blurBg ? 'blur(8px)' : 'none', pointerEvents: blurBg ? 'none' : 'auto', transition: 'filter 0.3s' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', position: 'sticky', top: 0, zIndex: 50, background: C.nav, backdropFilter: 'blur(8px)', borderBottom: '1px solid ' + C.navBorder }}>
          <h1 className="sayaTitle" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <svg viewBox="0 0 300 110" width="170" height="62" style={{ filter: 'drop-shadow(0 0 12px rgba(200,0,0,0.8))' }}>
              <defs>
                <linearGradient id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff2222" />
                  <stop offset="50%" stopColor="#cc0000" />
                  <stop offset="100%" stopColor="#660000" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <text x="150" y="55" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="68" fontWeight="bold" fill="url(#bloodGrad)" filter="url(#glow)" letterSpacing="4">SAYA</text>
              <path d="M 70 85 Q 70 95 65 108 M 120 85 Q 120 100 115 112 M 180 85 Q 180 97 175 110 M 230 85 Q 230 95 225 108" stroke="#990000" strokeWidth="5" strokeLinecap="round" fill="none" />
              <circle cx="65" cy="111" r="5" fill="#990000" />
              <circle cx="115" cy="115" r="6" fill="#990000" />
              <circle cx="175" cy="113" r="5" fill="#990000" />
              <circle cx="225" cy="111" r="6" fill="#990000" />
            </svg>
            <span style={{ fontSize: '0.8rem', color: '#ff3333', fontFamily: 'sans-serif', fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px', textShadow: '0 0 8px rgba(200,0,0,0.8)' }}>
              Hindi Horror Stories • Read &amp; Write
            </span>
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{ padding: '6px 10px', borderRadius: '18px', cursor: 'pointer', fontSize: '1rem', backgroundColor: 'transparent', border: '1px solid ' + C.border }}>{dk ? '☀️' : '🌙'}</button>
            <button onClick={() => setLang('hindi')} style={{ padding: '6px 14px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: lang === 'hindi' ? '#cc0000' : 'transparent', color: lang === 'hindi' ? '#fff' : C.sub, border: lang === 'hindi' ? 'none' : '1px solid ' + C.border }}>हिंदी</button>
            <button onClick={() => setLang('english')} style={{ padding: '6px 14px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: lang === 'english' ? '#cc0000' : 'transparent', color: lang === 'english' ? '#fff' : C.sub, border: lang === 'english' ? 'none' : '1px solid ' + C.border }}>Eng</button>
            {!isAdmin && <button onClick={() => setShowLogin(true)} style={{ padding: '6px 10px', backgroundColor: 'transparent', color: C.sub, border: '1px solid ' + C.border, borderRadius: '18px', cursor: 'pointer', fontSize: '0.7rem', opacity: 0.6 }}>Admin</button>}
            {isAdmin && <button onClick={() => setShowAdminMenu(true)} style={{ ...orgBtn, padding: '7px 14px', fontSize: '0.8rem' }}>👑 Admin</button>}
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 14px' }}>

          <div style={{ marginTop: '15px' }}>
            <input type="text" placeholder="🔍 कहानी खोजो..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={{ width: '100%', padding: '12px 16px', backgroundColor: C.card, color: C.text, border: '1px solid ' + C.border, borderRadius: '25px', boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none' }} />
            <div className="row" style={{ paddingBottom: '5px', paddingTop: '10px' }}>
              <button onClick={() => setCatFilter('all')} style={{ padding: '7px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, backgroundColor: catFilter === 'all' ? '#cc0000' : C.card, color: catFilter === 'all' ? '#fff' : C.sub, border: catFilter === 'all' ? 'none' : '1px solid ' + C.border }}>🎃 सभी</button>
              {CATEGORIES.map(ct => (
                <button key={ct} onClick={() => setCatFilter(ct)} style={{ padding: '7px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0, backgroundColor: catFilter === ct ? '#cc0000' : C.card, color: catFilter === ct ? '#fff' : C.sub, border: catFilter === ct ? 'none' : '1px solid ' + C.border }}>{ct}</button>
              ))}
            </div>
          </div>

          {!hasPass && !isAdmin && (
            <div onClick={buyPass} style={{ marginTop: '12px', background: 'linear-gradient(135deg, #2a0505, #150505)', border: '2px solid #aa0000', borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 20px rgba(170,0,0,0.25)' }}>
              <div>
                <p style={{ color: '#ee3333', margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>👑 Premium Pass — सिर्फ ₹99</p>
                <p style={{ color: '#aa7777', margin: '3px 0 0', fontSize: '0.78rem' }}>सभी paid कहानियाँ हमेशा के लिए UNLOCK — आने वाली भी!</p>
              </div>
              <span style={{ backgroundColor: '#aa0000', color: '#fff', padding: '9px 18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>₹99 लो</span>
            </div>
          )}
          {hasPass && (
            <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, #2a0505, #150505)', border: '2px solid #aa0000', borderRadius: '14px', padding: '10px 18px', textAlign: 'center' }}>
              <p style={{ color: '#ee3333', margin: 0, fontWeight: 'bold', fontSize: '0.95rem' }}>👑 आप PREMIUM MEMBER हो — सभी कहानियाँ UNLOCKED! 🎉</p>
            </div>
          )}

          {hero && (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginTop: '10px', border: '1px solid ' + C.border, cursor: 'pointer' }} onClick={() => openStory(hero)}>
              <img key={hero.id} src={hero.poster} alt={hero.title} className="heroImg" style={{ width: '100%', height: '46vw', maxHeight: '400px', minHeight: '220px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.9) 100%)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                {isNew(hero) && <span style={{ backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '3px 9px', fontSize: '0.7rem', fontWeight: 'bold' }}>NEW</span>}
                <h2 style={{ color: '#fff', margin: '8px 0 4px', fontSize: '1.7rem', fontFamily: 'Georgia, serif', textShadow: '2px 2px 10px #000' }}>{hero.title}</h2>
                <p style={{ color: '#ee5555', margin: '0 0 12px', fontSize: '0.85rem' }}>👁️ {formatViews(hero.views)} {isEng ? 'views' : 'बार देखी गई'}{hero.fearCount ? ' • 😱 ' + fearPct(hero) + '%' : ''}{hero.price > 0 && !isUnlocked(hero) ? ' • 🔒 ₹' + hero.price : ''}</p>
                <button style={{ ...orgBtn, padding: '11px 30px', fontSize: '1rem', boxShadow: '0 0 20px rgba(200,0,0,0.5)' }}>{hero.audio ? '▶ ' + (isEng ? 'Listen Now' : 'अभी सुनो') : '📖 ' + (isEng ? 'Read Now' : 'अभी पढ़ो')}</button>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '15px', display: 'flex', gap: '6px' }}>
                {heroList.map((_, i) => (
                  <div key={i} style={{ width: i === heroIdx % heroList.length ? '20px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i === heroIdx % heroList.length ? '#cc0000' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }}></div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <>
              <div className="skel" style={{ width: '100%', height: '250px', marginTop: '15px' }}></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', overflow: 'hidden' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skel" style={{ minWidth: '140px', height: '190px' }}></div>)}
              </div>
            </>
          )}

          {!loading && trending.length > 0 && (
            <div style={{ marginTop: '25px' }}>
              <h2 style={{ color: C.text, fontSize: '1.2rem', margin: '0 0 2px' }}>🔥 {isEng ? 'Most Watched' : 'सबसे ज़्यादा देखी गई'}</h2>
              <div className="row">
                {trending.map((story, i) => (
                  <div key={story.id} style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className="rankNum" style={{ marginRight: '-18px', zIndex: 1 }}>{i + 1}</span>
                    {posterCard(story, '130px')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && newest.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h2 style={{ color: C.text, fontSize: '1.2rem', margin: '0 0 2px' }}>🆕 {isEng ? 'New Stories' : 'नई कहानियाँ'}</h2>
              <div className="row">
                {newest.map(story => posterCard(story, '140px'))}
              </div>
            </div>
          )}

          {!loading && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
                <h2 style={{ color: C.text, fontSize: '1.2rem', margin: 0 }}>{isEng ? 'All Stories' : 'सभी कहानियाँ'}</h2>
                <button onClick={() => setTab('audio')} style={{ padding: '6px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: tab === 'audio' ? '#cc0000' : C.card, color: tab === 'audio' ? '#fff' : C.sub, border: tab === 'audio' ? 'none' : '1px solid ' + C.border }}>🔊 {isEng ? 'Listen' : 'सुनो'}</button>
                <button onClick={() => setTab('text')} style={{ padding: '6px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: tab === 'text' ? '#cc0000' : C.card, color: tab === 'text' ? '#fff' : C.sub, border: tab === 'text' ? 'none' : '1px solid ' + C.border }}>📖 {isEng ? 'Read' : 'पढ़ो'}</button>
              </div>

              {showList.length === 0 && <p style={{ color: C.sub, textAlign: 'center', padding: '30px' }}>{isEng ? 'No stories here yet...' : 'अभी कोई कहानी नहीं...'}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', paddingTop: '10px' }}>
                {showList.map((story) => (
                  <div key={story.id} onClick={() => openStory(story)} className="card" style={{ backgroundColor: C.card, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + C.border, cursor: 'pointer', position: 'relative' }}>
                    {story.poster ? (
                      <div style={{ position: 'relative' }}>
                        <img src={story.poster} alt={story.title} style={{ width: '100%', height: '210px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '28px 9px 7px' }}>
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '0.9rem', textShadow: '1px 1px 4px #000' }}>{story.title}</h3>
                          <p style={{ color: '#ee5555', margin: '3px 0 0', fontSize: '0.7rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '210px', background: 'linear-gradient(135deg, #1a0808, #330a0a)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        <span style={{ fontSize: '2.8rem' }}>{story.audio ? '🔊' : '🎃'}</span>
                        <h3 style={{ color: '#fff', margin: '10px 0 0', fontSize: '0.9rem', textAlign: 'center' }}>{story.title}</h3>
                        <p style={{ color: '#ee5555', margin: '4px 0 0', fontSize: '0.7rem' }}>👁️ {formatViews(story.views)}</p>
                      </div>
                    )}
                    {isNew(story) && <span className="newBadge" style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>NEW</span>}
                    {story.price > 0 && !isUnlocked(story) && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(200,0,0,0.95)', color: '#fff', borderRadius: '20px', padding: '3px 9px', fontSize: '0.7rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
                    {story.price > 0 && isUnlocked(story) && !isAdmin && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,170,0,0.9)', color: '#fff', borderRadius: '20px', padding: '3px 9px', fontSize: '0.7rem' }}>{hasPass ? '👑' : '✅'}</span>}
                    {isAdmin && (
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(story); }} style={{ backgroundColor: 'rgba(200,0,0,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); removeStory(story.id); }} style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ color: C.footer, fontSize: '0.8rem', margin: '0 0 10px' }}>© साया - खौफ़ की हिंदी कहानियाँ 🎃 • "डर सिर्फ एक कहानी की दूरी पर है..."</p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>
              <a href="/policy" style={{ color: '#ee4444', textDecoration: 'none', margin: '0 8px' }}>About Us</a>•
              <a href="/policy" style={{ color: '#ee4444', textDecoration: 'none', margin: '0 8px' }}>Contact</a>•
              <a href="/policy" style={{ color: '#ee4444', textDecoration: 'none', margin: '0 8px' }}>Privacy Policy</a>•
              <a href="/policy" style={{ color: '#ee4444', textDecoration: 'none', margin: '0 8px' }}>Terms</a>•
              <a href="/policy" style={{ color: '#ee4444', textDecoration: 'none', margin: '0 8px' }}>Refund Policy</a>
            </p>
          </div>
        </div>
      </div>

      {!blurBg && (
        <>
          <button onClick={() => { setShowWheel(true); setWheelMsg(''); }} className="wobble" style={{ position: 'fixed', bottom: '20px', left: '15px', zIndex: 90, backgroundColor: dk ? '#1a0808' : '#fff', border: '2px solid #cc0000', borderRadius: '50%', width: '56px', height: '56px', fontSize: '1.6rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(200,0,0,0.4)' }}>🎰</button>
          <button onClick={toggleAmb} style={{ position: 'fixed', bottom: '20px', right: '15px', zIndex: 90, backgroundColor: ambOn ? '#cc0000' : (dk ? '#1a0808' : '#fff'), border: '2px solid #cc0000', borderRadius: '50%', width: '56px', height: '56px', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(200,0,0,0.4)' }}>{ambOn ? '🔊' : '🔇'}</button>
          <button onClick={installApp} style={{ position: 'fixed', bottom: '85px', right: '15px', zIndex: 90, backgroundColor: '#cc0000', color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 18px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(200,0,0,0.6)' }}>📲 App Install करो</button>
          <button onClick={() => setShowSubmit(true)} style={{ position: 'fixed', bottom: '85px', left: '15px', zIndex: 90, backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '25px', padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(26,92,42,0.6)' }}>✍️ अपनी कहानी भेजो</button>
        </>
      )}

      {showAdminMenu && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 125, padding: '20px' }} onClick={() => setShowAdminMenu(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: '2px solid #cc0000', width: '100%', maxWidth: '340px', boxShadow: '0 0 40px rgba(200,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ color: '#ee4444', margin: 0, fontSize: '1.3rem' }}>👑 Admin Panel</h2>
              <button onClick={() => setShowAdminMenu(false)} style={{ backgroundColor: '#331818', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
            </div>
            <button onClick={() => { setShowAdminMenu(false); setShowPanel(true); }} style={{ width: '100%', padding: '15px', marginBottom: '10px', backgroundColor: '#cc0000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left' }}>📝 Nayi Story Add Karo</button>
            <button onClick={() => { setShowAdminMenu(false); loadPending(); }} style={{ width: '100%', padding: '15px', marginBottom: '10px', backgroundColor: '#aa0000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left' }}>⏳ Pending Stories (Review)</button>
            <button onClick={() => { setShowAdminMenu(false); sendTestNotification(); }} style={{ width: '100%', padding: '15px', marginBottom: '10px', backgroundColor: '#5c00a3', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left' }}>📢 Push Notification Bhejo</button>
            <button onClick={async () => { await signOut(auth); setShowAdminMenu(false); alert('Logout ho gaye! 👋'); }} style={{ width: '100%', padding: '15px', backgroundColor: '#8b0000', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left' }}>🚪 Logout</button>
            <div style={{ marginTop: '15px', padding: '12px', borderRadius: '8px', backgroundColor: '#000', fontSize: '0.78rem', color: '#aaa', border: '1px solid #333', textAlign: 'left' }}>
               <p style={{ margin: '0 0 5px', color: '#ee4444', fontWeight: 'bold' }}>📡 Notification Status:</p>
               <div>Service Worker: <span style={{ color: '#fff' }}>{debugSW}</span></div>
               <div>Permission: <span style={{ color: '#fff' }}>{debugPermission}</span></div>
               <div>Subscribers: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{debugTokenCount} users</span></div>
            </div>
          </div>
        </div>
      )}

      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 125, padding: '20px', overflowY: 'auto' }} onClick={() => setShowSubmit(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: '2px solid #1a5c2a', width: '100%', maxWidth: '500px', margin: '20px 0' }}>
            <h2 style={{ color: '#4caf50', marginTop: 0 }}>✍️ अपनी डरावनी कहानी भेजो</h2>
            <p style={{ color: '#885555', fontSize: '0.85rem', marginTop: '-8px' }}>आपकी आपबीती या कहानी - admin check karke publish karega, आपके नाम के साथ! 👻</p>
            <input type="text" placeholder="आपका नाम (yahi publish hoga)" value={subName} onChange={(e) => setSubName(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="कहानी का Title" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} style={inputStyle} />
            <textarea placeholder="अपनी पूरी कहानी यहाँ लिखो... (kam se kam 100 akshar)" value={subText} onChange={(e) => setSubText(e.target.value)} rows="10" style={{ ...inputStyle, resize: 'vertical' }} />
            <p style={{ color: '#666', fontSize: '0.75rem' }}>⚠️ Gandi bhasha/galat content wali stories REJECT ho jayengi.</p>
            <button onClick={submitUserStory} disabled={subSending} style={{ width: '100%', padding: '15px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.05rem', cursor: 'pointer', fontWeight: 'bold', opacity: subSending ? 0.5 : 1 }}>{subSending ? 'भेज रहे हैं...' : '📤 कहानी भेजो'}</button>
            <button onClick={() => setShowSubmit(false)} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>बंद करो</button>
          </div>
        </div>
      )}

      {showPending && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 125, padding: '20px', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: '2px solid #aa0000', width: '100%', maxWidth: '600px', margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#ee3333', margin: 0 }}>⏳ Pending Stories ({pendingSubs.length})</h2>
              <button onClick={() => setShowPending(false)} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer' }}>✕</button>
            </div>
            {pendingSubs.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: '30px' }}>Koi pending story nahi hai! 🎉</p>}
            {pendingSubs.map(sub => (
              <div key={sub.id} style={{ backgroundColor: '#0d0505', borderRadius: '12px', padding: '15px', marginTop: '15px', border: '1px solid #331515' }}>
                <h3 style={{ color: '#ee4444', margin: '0 0 5px' }}>{sub.title}</h3>
                <p style={{ color: '#4caf50', fontSize: '0.85rem', margin: '0 0 10px' }}>✍️ {sub.writer} • 📅 {sub.date}</p>
                <div style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.7', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#140808', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{sub.text}</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button onClick={() => approveSub(sub)} style={{ flex: 1, padding: '12px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Approve & Publish</button>
                  <button onClick={() => rejectSub(sub.id)} style={{ flex: 1, padding: '12px', backgroundColor: '#8b0000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>❌ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showIosGuide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 130, padding: '20px' }} onClick={() => setShowIosGuide(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: '2px solid #cc0000', maxWidth: '340px', textAlign: 'center' }}>
            <h2 style={{ color: '#ee4444', marginTop: 0 }}>📲 iPhone में Install करो</h2>
            <div style={{ textAlign: 'left', color: '#e8c8c8', fontSize: '0.95rem', lineHeight: '2' }}>
              <p>1️⃣ नीचे <b>Share बटन</b> दबाओ (⬆️ वाला box)</p>
              <p>2️⃣ नीचे scroll करो</p>
              <p>3️⃣ <b>"Add to Home Screen"</b> दबाओ</p>
              <p>4️⃣ <b>"Add"</b> दबाओ — हो गया! 🎉</p>
            </div>
            <p style={{ color: '#885555', fontSize: '0.8rem' }}>⚠️ Safari browser में ही चलेगा!</p>
            <button onClick={() => setShowIosGuide(false)} style={{ ...orgBtn, padding: '10px 30px' }}>समझ गया ✅</button>
          </div>
        </div>
      )}

      {showWheel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120, padding: '20px' }} onClick={() => !spinning && setShowWheel(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: '2px solid #cc0000', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 0 40px rgba(200,0,0,0.3)' }}>
            <h2 style={{ color: '#ee4444', marginTop: 0 }}>🎰 किस्मत का पहिया</h2>
            <p style={{ color: '#aa7777', fontSize: '0.85rem', marginTop: '-5px' }}>हफ्ते में 1 बार घुमाओ — FREE कहानी जीतो!</p>
            <div style={{ position: 'relative', width: '250px', height: '250px', margin: '15px auto' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 2 }}>🔻</div>
              <div style={{ width: '250px', height: '250px', borderRadius: '50%', border: '6px solid #8b0000', boxSizing: 'border-box', background: 'conic-gradient(#cc0000 0deg 60deg, #1a0a0a 60deg 120deg, #cc0000 120deg 180deg, #1a0a0a 180deg 240deg, #2a0808 240deg 300deg, #1a0a0a 300deg 360deg)', transform: `rotate(${wheelDeg}deg)`, transition: 'transform 4s cubic-bezier(0.15,0.85,0.25,1)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: '#1a0808', border: '3px solid #8b0000', borderRadius: '50%', width: '55px', height: '55px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>👻</div>
            </div>
            <p style={{ color: '#885555', fontSize: '0.8rem' }}>❤️ लाल हिस्सा = 🎁 FREE कहानी</p>
            <button onClick={spinWheel} disabled={spinning} style={{ ...orgBtn, padding: '14px 40px', fontSize: '1.1rem', opacity: spinning ? 0.5 : 1 }}>{spinning ? 'घूम रहा है...' : '🎡 घुमाओ!'}</button>
            {wheelMsg && <p style={{ color: '#ee5555', marginTop: '15px', fontSize: '0.95rem' }}>{wheelMsg}</p>}
            {!spinning && <p onClick={() => setShowWheel(false)} style={{ color: '#555', marginTop: '12px', fontSize: '0.8rem', cursor: 'pointer' }}>बंद करो ✕</p>}
          </div>
        </div>
      )}

      {readingStory && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,0,0,0.6)', zIndex: 100, overflowY: 'auto', padding: '15px' }}>
          <div className="vignette"></div>
          <span className="storyBat">🦇</span>
          <div className="spider"><div className="thread"></div>🕷️</div>
          <span className="eyes">👀</span>
          <span className="eyes eyes2">👀</span>
          <div className="fog"></div>
          <button onClick={closeStory} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 110, backgroundColor: '#cc0000', color: '#fff', border: 'none', borderRadius: '25px', padding: '13px 32px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 25px rgba(200,0,0,0.7)' }}>← वापस</button>
          <div style={{ maxWidth: '650px', margin: '35px auto 90px', position: 'relative', zIndex: 102 }}>
            <div className="frame" style={{ padding: '35px 18px 25px' }}>
              <span className="corner" style={{ top: '6px', left: '8px' }}>🕸️</span>
              <span className="corner" style={{ top: '6px', right: '8px' }}>🕸️</span>
              <span className="corner" style={{ bottom: '6px', left: '8px' }}>🦴</span>
              <span className="corner" style={{ bottom: '6px', right: '8px' }}>🦴</span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                <button onClick={closeStory} style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#ee5555', border: '1px solid #6b1515', borderRadius: '8px', cursor: 'pointer' }}>← वापस</button>
                <button onClick={() => shareStory(readingStory)} style={{ padding: '8px 16px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📤 Share</button>
                <button onClick={() => shareCardImg(readingStory)} style={{ padding: '8px 16px', backgroundColor: '#5c1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖼️ Poster Share</button>
              </div>

              {readingStory.poster && (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px', border: '2px solid #6b1515' }}>
                  <img src={readingStory.poster} alt={readingStory.title} style={{ width: '100%', display: 'block', filter: (isUnlocked(readingStory) || readingStory.audio) ? 'none' : 'blur(8px)' }} />
                </div>
              )}
              <h1 style={{ color: '#ee4444', margin: '0 0 5px', fontSize: '1.6rem', textAlign: 'center', fontFamily: 'Georgia, serif', textShadow: '0 0 15px rgba(200,0,0,0.5)' }}>{readingStory.title}</h1>
              <p style={{ color: '#885555', textAlign: 'center', margin: '0 0 15px', fontSize: '0.85rem' }}>👁️ {formatViews((readingStory.views || 0) + 1)} बार देखी गई{readingStory.fearCount ? ' • 😱 ' + fearPct(readingStory) + '% लोगों को डर लगा' : ''}</p>

              {!isUnlocked(readingStory) && readingStory.audio && (
                <div className={playing ? 'playing' : ''} style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '20px', marginBottom: '22px', border: '1px dashed #cc0000', textAlign: 'center' }}>
                  <audio ref={audioRef} src={readingStory.audio} preload="metadata" playsInline
                    onTimeUpdate={() => {
                      const a = audioRef.current;
                      if (!a) return;
                      setCurTime(a.currentTime);
                      if (a.currentTime >= 45) {
                        a.pause();
                        setPlaying(false);
                        a.currentTime = 0;
                        alert("😱 रोमांचक मोड़! आगे क्या हुआ? जानने के लिए कहानी अनलॉक करें!");
                      }
                    }}
                    onLoadedMetadata={() => setDuration(audioRef.current ? audioRef.current.duration : 0)}
                    onEnded={() => setPlaying(false)} />
                  <p style={{ color: '#ee3333', margin: '0 0 10px', fontWeight: 'bold', fontSize: '0.9rem' }}>🎧 45-सेकंड फ्री टीज़र (सुनकर देखें):</p>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '5px', height: '32px', marginBottom: '14px' }}>
                    <div className="vbar b1" style={{ height: '10px' }}></div><div className="vbar b2" style={{ height: '18px' }}></div>
                    <div className="vbar b3" style={{ height: '14px' }}></div><div className="vbar b4" style={{ height: '22px' }}></div>
                    <div className="vbar b5" style={{ height: '9px' }}></div>
                  </div>
                  <button onClick={togglePlay} style={{ backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '50%', width: '64px', height: '64px', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(200,0,0,0.6)' }}>{playing ? '⏸' : '▶'}</button>
                  <p style={{ color: '#885555', marginTop: '10px', fontSize: '0.78rem' }}>जैसे ही रोमांच चरम पर पहुंचेगा, ऑडियो रुक जाएगा 🎃</p>
                </div>
              )}

              {!isUnlocked(readingStory) && (
                <div style={{ textAlign: 'center', padding: '15px 10px' }}>
                  <div style={{ fontSize: '3.5rem' }}>🔒</div>
                  <h2 style={{ color: '#ee4444', margin: '10px 0' }}>यह प्रीमियम कहानी है</h2>
                  <div style={{ backgroundColor: 'rgba(200,0,0,0.12)', border: '1px dashed #cc0000', borderRadius: '10px', padding: '10px', margin: '10px auto', maxWidth: '320px' }}>
                    <p style={{ color: '#ee5555', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>⚡ आज का ऑफर खत्म होने में:</p>
                    <p style={{ color: '#ff4444', margin: '5px 0 0', fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{offerLeft}</p>
                    <p style={{ color: '#aa7777', margin: '5px 0 0', fontSize: '1rem' }}><s style={{ color: '#777' }}>₹{readingStory.price * 2}</s> <span style={{ color: '#00cc44', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{readingStory.price}</span></p>
                  </div>
                  <button onClick={() => payStory(readingStory)} style={{ ...orgBtn, padding: '16px 40px', fontSize: '1.15rem', marginTop: '5px', boxShadow: '0 0 25px rgba(200,0,0,0.4)' }}>💳 ₹{readingStory.price} देकर अनलॉक करो</button>
                  <p style={{ color: '#666', margin: '15px 0 8px' }}>—— या ——</p>
                  <button onClick={buyPass} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #aa0000, #660000)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 0 20px rgba(170,0,0,0.4)' }}>👑 ₹99 Premium Pass — सब कुछ UNLOCK</button>
                  <p style={{ color: '#885555', fontSize: '0.75rem', marginTop: '8px' }}>एक बार दो, सभी paid कहानियाँ हमेशा के लिए!</p>
                  <p style={{ color: '#666', margin: '15px 0 8px' }}>—— या ——</p>
                  <button onClick={() => shareUnlock(readingStory)} style={{ padding: '13px 28px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>🎁 5 दोस्तों को Share करो, FREE पाओ ({sharesCnt[readingStory.id] || 0}/5)</button>
                  <p style={{ color: '#885555', fontSize: '0.75rem', marginTop: '8px' }}>WhatsApp par 5 baar share karo aur kahani free unlock!</p>
                </div>
              )}

              {isUnlocked(readingStory) && (
                <>
                  {readingStory.audio && (
                    <div className={playing ? 'playing' : ''} style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '20px', marginBottom: '15px', border: '1px solid #6b1515', textAlign: 'center' }}>
                      <audio ref={audioRef} src={readingStory.audio} preload="metadata" playsInline
                        onTimeUpdate={() => setCurTime(audioRef.current ? audioRef.current.currentTime : 0)}
                        onLoadedMetadata={() => setDuration(audioRef.current ? audioRef.current.duration : 0)}
                        onEnded={() => setPlaying(false)} />
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '5px', height: '32px', marginBottom: '14px' }}>
                        <div className="vbar b1" style={{ height: '10px' }}></div><div className="vbar b2" style={{ height: '18px' }}></div>
                        <div className="vbar b3" style={{ height: '14px' }}></div><div className="vbar b4" style={{ height: '22px' }}></div>
                        <div className="vbar b5" style={{ height: '9px' }}></div>
                      </div>
                      <input type="range" min="0" max={duration || 0} step="0.1" value={curTime} onChange={onSeek} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa7777', fontSize: '0.8rem', marginTop: '5px' }}>
                        <span>{formatTime(curTime)}</span><span>{formatTime(duration)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px', marginTop: '14px' }}>
                        <button onClick={() => skip(-10)} style={{ backgroundColor: '#2a0a0a', color: '#ee5555', border: '1px solid #6b1515', borderRadius: '50%', width: '52px', height: '52px', fontSize: '0.8rem', cursor: 'pointer' }}>-10s</button>
                        <button onClick={togglePlay} style={{ backgroundColor: '#cc0000', color: 'white', border: 'none', borderRadius: '50%', width: '72px', height: '72px', fontSize: '1.7rem', cursor: 'pointer', boxShadow: '0 0 25px rgba(200,0,0,0.7)' }}>{playing ? '⏸' : '▶'}</button>
                        <button onClick={() => skip(10)} style={{ backgroundColor: '#2a0a0a', color: '#ee5555', border: '1px solid #6b1515', borderRadius: '50%', width: '52px', height: '52px', fontSize: '0.8rem', cursor: 'pointer' }}>+10s</button>
                      </div>
                      <button onClick={() => downloadAudio(readingStory)} style={{ ...orgBtn, padding: '11px 26px', marginTop: '16px', fontSize: '0.9rem' }}>⬇️ ऑडियो डाउनलोड करो</button>
                      <p style={{ color: '#885555', marginTop: '12px', marginBottom: 0, fontSize: '0.82rem' }}>🎧 हेडफ़ोन लगाओ... अकेले मत सुनना</p>
                    </div>
                  )}

                  {readingStory.text && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <button onClick={() => downloadText(readingStory)} style={{ ...orgBtn, padding: '9px 22px', marginBottom: '14px', fontSize: '0.85rem' }}>⬇️ कहानी डाउनलोड करो</button>
                      </div>
                      <div style={{ color: '#e8c8c8', lineHeight: '2', fontSize: '1.1rem', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', padding: '5px 8px 10px' }}>{readingStory.text}</div>
                    </>
                  )}

                  <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '15px', marginTop: '10px', border: '1px solid #6b1515', textAlign: 'center' }}>
                    <p style={{ color: '#ee4444', margin: '0 0 8px', fontWeight: 'bold' }}>😱 कितना डर लगा?</p>
                    {fearVotes[readingStory.id] ? (
                      <p style={{ color: '#aa7777', margin: 0, fontSize: '0.9rem' }}>आपने {fearVotes[readingStory.id]} 💀 दिए! • {fearPct(readingStory)}% लोगों को डर लगा</p>
                    ) : (
                      <div>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} className="skullBtn" onClick={() => rateFear(readingStory, n)}>💀</button>
                        ))}
                        <p style={{ color: '#666', margin: '5px 0 0', fontSize: '0.75rem' }}>(1 = थोड़ा डर, 5 = बहुत डर!)</p>
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '15px', marginTop: '15px', border: '1px solid #6b1515' }}>
                    <p style={{ color: '#ee4444', margin: '0 0 12px', fontWeight: 'bold' }}>💬 Comments ({comments.length})</p>

                    {replyTo && (
                      <div style={{ backgroundColor: '#1a0808', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ee5555', fontSize: '0.8rem' }}>↩️ Reply: <b>{replyTo.name}</b> ko</span>
                        <button onClick={() => setReplyTo(null)} style={{ backgroundColor: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}

                    {!isAdmin && <input type="text" placeholder="आपका नाम" value={cmtName} onChange={(e) => setCmtName(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />}
                    <textarea placeholder={replyTo ? 'अपना reply लिखो...' : 'अपना comment लिखो...'} value={cmtText} onChange={(e) => setCmtText(e.target.value)} rows="2" style={{ ...inputStyle, marginBottom: '8px', resize: 'vertical' }} />
                    <button onClick={postComment} disabled={cmtSending} style={{ ...orgBtn, padding: '10px 25px', fontSize: '0.9rem', opacity: cmtSending ? 0.5 : 1 }}>{cmtSending ? 'भेज रहे...' : (replyTo ? '↩️ Reply भेजो' : '💬 Comment करो')}</button>

                    <div style={{ marginTop: '15px' }}>
                      {comments.filter(c => !c.parentId).length === 0 && <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center' }}>अभी कोई comment नहीं... पहला comment आप करो! 👻</p>}
                      {comments.filter(c => !c.parentId).map(c => (
                        <div key={c.id} style={{ backgroundColor: '#140808', borderRadius: '10px', padding: '12px', marginBottom: '10px', border: c.name.includes('👑') ? '1px solid #cc0000' : '1px solid #2a1515' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: c.name.includes('👑') ? '#ee4444' : '#4caf50', fontSize: '0.85rem', fontWeight: 'bold' }}>{c.name}</span>
                              {c.isVIP && (
                                <span style={{ background: 'linear-gradient(90deg, #aa0000, #cc0000)', color: '#fff', padding: '2px 7px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 'bold', display: 'inline-block', boxShadow: '0 0 8px rgba(200,0,0,0.5)' }}>👑 VIP MEMBER</span>
                              )}
                            </div>
                            <span style={{ color: '#555', fontSize: '0.7rem' }}>{c.date}</span>
                          </div>
                          <p style={{ color: '#ddd', margin: '6px 0', fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'sans-serif' }}>{c.text}</p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setReplyTo(c)} style={{ backgroundColor: 'transparent', color: '#ee5555', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>↩️ Reply</button>
                            {isAdmin && <button onClick={() => deleteComment(c.id)} style={{ backgroundColor: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>🗑️ Delete</button>}
                          </div>

                          {comments.filter(r => r.parentId === c.id).map(r => (
                            <div key={r.id} style={{ backgroundColor: '#0d0505', borderRadius: '8px', padding: '10px', marginTop: '8px', marginLeft: '15px', borderLeft: '2px solid ' + (r.name.includes('👑') ? '#cc0000' : '#3a2020') }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: r.name.includes('👑') ? '#ee4444' : '#4caf50', fontSize: '0.8rem', fontWeight: 'bold' }}>{r.name}</span>
                                  {r.isVIP && (
                                    <span style={{ background: 'linear-gradient(90deg, #aa0000, #cc0000)', color: '#fff', padding: '1px 5px', borderRadius: '8px', fontSize: '0.58rem', fontWeight: 'bold' }}>👑 VIP</span>
                                  )}
                                </div>
                                <span style={{ color: '#555', fontSize: '0.65rem' }}>{r.date}</span>
                              </div>
                              <p style={{ color: '#ccc', margin: '5px 0', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'sans-serif' }}>{r.text}</p>
                              {isAdmin && <button onClick={() => deleteComment(r.id)} style={{ backgroundColor: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>🗑️ Delete</button>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowLogin(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a0808', padding: '30px', borderRadius: '16px', border: '2px solid #cc0000', width: '100%', maxWidth: '350px', boxShadow: '0 0 40px rgba(200,0,0,0.3)' }}>
            <h2 style={{ color: '#ee4444', marginTop: 0, textAlign: 'center' }}>🔐 Admin Login</h2>
            <p style={{ color: '#885555', fontSize: '0.85rem', textAlign: 'center' }}>Sirf admin ka Google account chalega</p>
            <button onClick={handleLogin} style={{ ...orgBtn, width: '100%', padding: '14px', fontSize: '1rem' }}>🔑 Google Se Login Karo</button>
          </div>
        </div>
      )}

      {showPanel && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 100, padding: '20px', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#1a0808', padding: '25px', borderRadius: '16px', border: editId ? '2px solid #aa0000' : '2px solid #cc0000', width: '100%', maxWidth: '550px', margin: '20px 0', boxShadow: '0 0 40px rgba(200,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: editId ? '#ee3333' : '#ee4444', margin: 0, fontSize: '1.3rem' }}>{editId ? '✏️ Edit Story' : '📝 Nayi Story'}</h2>
              <button onClick={() => { setShowPanel(false); clearForm(); }} style={{ backgroundColor: '#331818', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ marginTop: '15px' }}>
              <input type="text" placeholder="Title (zaroori)" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
              <label style={{ color: '#ee5555', fontSize: '0.85rem' }}>🌐 Language:</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', marginTop: '5px' }}>
                <button onClick={() => setStoryLang('hindi')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: storyLang === 'hindi' ? '#cc0000' : '#0a0505', color: storyLang === 'hindi' ? '#fff' : '#777', border: '1px solid #441515' }}>हिंदी</button>
                <button onClick={() => setStoryLang('english')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: storyLang === 'english' ? '#cc0000' : '#0a0505', color: storyLang === 'english' ? '#fff' : '#777', border: '1px solid #441515' }}>English</button>
              </div>
              <label style={{ color: '#ee5555', fontSize: '0.85rem' }}>🏷️ Category:</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', marginTop: '5px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(ct => (
                  <button key={ct} onClick={() => setStoryCat(ct)} style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: storyCat === ct ? '#cc0000' : '#0a0505', color: storyCat === ct ? '#fff' : '#777', border: '1px solid #441515' }}>{ct}</button>
                ))}
              </div>
              <label style={{ color: '#ee5555', fontSize: '0.85rem' }}>🖼️ Poster Upload Karo:</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'poster')} style={{ ...inputStyle, padding: '8px' }} />
              {uploading === 'poster' && <p style={{ color: '#ee3333', margin: '0 0 10px' }}>⏳ Poster upload ho raha hai...</p>}
              {poster && <img src={poster} style={{ width: '80px', borderRadius: '8px', marginBottom: '10px' }} />}
              <label style={{ color: '#ee5555', fontSize: '0.85rem' }}>🔊 Audio Upload Karo (WhatsApp/M4A/MP3):</label>
              <input
                type="file"
                accept="audio/*,video/*,application/octet-stream,application/x-dec-event,.mp3,.m4a,.aac,.wav,.ogg,.opus,.caf,.amr"
                onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'audio')}
                style={{ ...inputStyle, padding: '8px' }}
              />
              <p style={{ color: '#885555', fontSize: '0.78rem', marginTop: '-8px', marginBottom: '12px' }}>
                💡 Tip: Files open karke apni audio track select karein.
              </p>
              {uploading === 'audio' && <p style={{ color: '#ee3333', margin: '0 0 10px' }}>⏳ Audio upload ho raha hai...</p>}
              {audio && <p style={{ color: '#00cc00', margin: '0 0 10px', fontSize: '0.8rem' }}>✅ Audio ready hai</p>}
              <textarea placeholder="Story Text (audio-only ho toh khali chhodo)" value={text} onChange={(e) => setText(e.target.value)} rows="6" style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', marginRight: '10px' }}>💰 Price ₹ (0 = Free):</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100px', padding: '10px', backgroundColor: '#0a0505', color: 'white', border: '1px solid #441515', borderRadius: '8px' }} />
              </div>
              <button onClick={saveStory} disabled={!!uploading} style={{ ...orgBtn, width: '100%', padding: '15px', fontSize: '1.05rem', backgroundColor: editId ? '#aa0000' : '#cc0000', color: '#fff', opacity: uploading ? 0.5 : 1 }}>{editId ? '✏️ Update Karo' : '✅ Publish Karo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
