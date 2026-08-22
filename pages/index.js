Bhai, ye raha **poora code**. Purana `app/page.jsx` me sab delete karo, ye paste karo. **Sleep Timer** already integrated hai.

```jsx
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

const isNew = (s) => s.createdAt && (Date.now() - s.createdAt) < 7 * 24 * 3600 * 1000;

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
  const [sleepTimer, setSleepTimer] = useState(0);
  const [sleepEnd, setSleepEnd] = useState(0);
  const audioRef = useRef(null);
  const ambRef = useRef(null);
  const touchX = useRef(0);
  const readingRef = useRef(null);
  const sleepIntervalRef = useRef(null);

  useEffect(() => {
    loadStories();
    onAuthStateChanged(auth, (u) => { setIsAdmin(!!u && u.email === ADMIN_EMAIL); });
    try { setUnlocked(JSON.parse(localStorage.getItem('unlocked') || '[]')); } catch (e) {}
    try { setFearVotes(JSON.parse(localStorage.getItem('fearVotes') || '{}')); } catch (e) {}
    try { setSharesCnt(JSON.parse(localStorage.getItem('sharesCnt') || '{}')); } catch (e) {}
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(s);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPop = () => {
      if (readingRef.current) {
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
      setOfferLeft(h + 'gh ' + m + 'm ' + sc + 's');
    }, 1000);
    const ht = setInterval(() => setHeroIdx(i => i + 1), 4000);
    return () => { clearInterval(t); clearInterval(ht); window.removeEventListener('popstate', onPop); };
  }, []);

  useEffect(() => {
    if (!readingStory) return;
    const block = (e) => {
      if (e.touches && e.touches[0] && e.touches[0].clientX < 50) e.preventDefault();
    };
    document.addEventListener('touchmove', block, { passive: false });
    return () => document.removeEventListener('touchmove', block);
  }, [readingStory]);

  const startSleepTimer = (mins) => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    if (sleepTimer === mins) {
      setSleepTimer(0);
      setSleepEnd(0);
      return;
    }
    setSleepTimer(mins);
    setSleepEnd(Date.now() + mins * 60 * 1000);
    sleepIntervalRef.current = setInterval(() => {
      if (Date.now() >= sleepEnd) {
        if (audioRef.current) audioRef.current.pause();
        setPlaying(false);
        setSleepTimer(0);
        setSleepEnd(0);
        clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
        alert('😴 Sleep timer khatam. Good night!');
      }
    }, 1000);
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
      alert('🎉 Kahani bhej di gayi! Admin check karke jald publish karega. Dhanyawad! 👻');
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
      await addDoc(collection(db, "stories"), {
        title: sub.title, text: sub.text + '\n\n— ✍️ Lekhak: ' + sub.writer,
        poster: '', audio: '', price: 0, lang: 'hindi',
        views: 0, fearTotal: 0, fearCount: 0,
        createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN')
      });
      await deleteDoc(doc(db, "submissions", sub.id));
      setPendingSubs(prev => prev.filter(p => p.id !== sub.id));
      alert('✅ Approve! "' + sub.title + '" ab public hai!');
      loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const rejectSub = async (id) => {
    if (!confirm('Pakka REJECT karna hai? Story delete ho jayegi!')) return;
    try {
      await deleteDoc(doc(db, "submissions", id));
      setPendingSubs(prev => prev.filter(p => p.id !== id));
    } catch (e) { alert('Error: ' + e.message); }
  };

  const loadComments = async (storyId) => {
    try {
      const snap = await getDocs(query(collection(db, "comments"), orderBy("createdAt", "desc")));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.storyId === storyId));
    } catch (e) { setComments([]); }
  };

  const postComment = async () => {
    if (!readingStory) return;
    if (!cmtText.trim()) return alert('Comment likho!');
    if (!isAdmin && !cmtName.trim()) return alert('Naam likho!');
    setCmtSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        storyId: readingStory.id,
        name: isAdmin ? '👑 Admin (Saya)' : cmtName.trim(),
        text: cmtText.trim(),
        parentId: replyTo ? replyTo.id : null,
        createdAt: Date.now(),
        date: new Date().toLocaleDateString('hi-IN')
      });
      setCmtText(''); setReplyTo(null);
      loadComments(readingStory.id);
    } catch (e) { alert('Comment error: ' + e.message); }
    setCmtSending(false);
  };

  const deleteComment = async (id) => {
    if (!isAdmin) return;
    if (!confirm('Yeh comment delete karna hai?')) return;
    try {
      await deleteDoc(doc(db, "comments", id));
      const replies = comments.filter(x => x.parentId === id);
      for (const r of replies) {
        try { await deleteDoc(doc(db, "comments", r.id)); } catch (e) {}
      }
      if (readingStory) loadComments(readingStory.id);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const closeStory = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    setSleepTimer(0);
    setSleepEnd(0);
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
      alert('App pehle se installed hai, ya browser ke menu mein "Install app" dabao!');
    }
  };

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark';
    setTheme(nt);
    localStorage.setItem('theme', nt);
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
      } else {
        setShowLogin(false);
        setShowAdminMenu(true);
        loadPending();
        alert('Welcome Admin! ✅');
      }
    } catch (e) { alert('Login error: ' + e.message); }
  };

  const clearForm = () => { setTitle(''); setText(''); setPoster(''); setAudio(''); setPrice('0'); setStoryLang('hindi'); setEditId(null); };

  const uploadFile = async (file, kind) => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) {
        if (kind === 'poster') setPoster(data.secure_url); else setAudio(data.secure_url);
        alert((kind === 'poster' ? 'Poster' : 'Audio') + ' upload ho gaya! ✅');
      } else { alert('Upload fail: ' + (data.error && data.error.message ? data.error.message : 'dobara try karo')); }
    } catch (e) { alert('Upload error: ' + e.message); }
    setUploading('');
  };

  const saveStory = async () => {
    if (!title) return alert('Title toh likho!');
    if (!text && !audio) return alert('Story Text ya Audio - kuch toh dalo!');
    try {
      if (editId) {
        await updateDoc(doc(db, "stories", editId), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0, lang: storyLang });
        alert('Update ho gayi! ✏️');
      } else {
        await addDoc(collection(db, "stories"), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0, lang: storyLang, views: 0, fearTotal: 0, fearCount: 0, createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN') });
        alert('Publish ho gayi! 🎃');
      }
      clearForm(); loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const startEdit = (story) => {
    setEditId(story.id); setTitle(story.title || ''); setText(story.text || '');
    setPoster(story.poster || ''); setAudio(story.audio || ''); setPrice(String(story.price || 0));
    setStoryLang(story.lang || 'hindi');
    setShowPanel(true);
  };

  const removeStory = async (id) => {
    if (!confirm('Pakka delete karna hai?')) return;
    try {
      await deleteDoc(doc(db, "stories", id));
      loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const isUnlocked = (story) => !story.price || story.price === 0 || unlocked.includes(story.id) || isAdmin;

  const doUnlock = (id) => {
    const nu = [...unlocked, id];
    setUnlocked(nu); localStorage.setItem('unlocked', JSON.stringify(nu));
  };

  const payStory = (story) => {
    if (RAZORPAY_KEY.includes('YAHAN')) return alert('Razorpay Key abhi nahi dali gayi!');
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY, amount: story.price * 100, currency: 'INR',
      name: 'Saya - Horror Stories', description: story.title,
      handler: function () { doUnlock(story.id); alert('Payment ho gayi! Ab suno aur download karo 🎃'); },
      theme: { color: '#ff6600' }
    });
    rzp.open();
  };

  const shareUnlock = (story) => {
    const msg = '👻 "' + story.title + '" - darawani kahani suno/padho!\n\n' + window.location.origin + '\n\n🎧 Akele mat sunna...';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    const cnt = (sharesCnt[story.id] || 0) + 1;
    const ns = { ...sharesCnt, [story.id]: cnt };
    setSharesCnt(ns); localStorage.setItem('sharesCnt', JSON.stringify(ns));
    if (cnt >= 5) { doUnlock(story.id); alert('🎉 5 shares! Kahani FREE unlock ho gayi!'); }
  };

  const rateFear = async (story, n) => {
    if (fearVotes[story.id]) return alert('Aap pehle hi rate kar chuke ho! 💀');
    try {
      await updateDoc(doc(db, "stories", story.id), { fearTotal: increment(n), fearCount: increment(1) });
      const nv = { ...fearVotes, [story.id]: n };
      setFearVotes(nv); localStorage.setItem('fearVotes', JSON.stringify(nv));
      const upd = s => ({ ...s, fearTotal: (s.fearTotal || 0) + n, fearCount: (s.fearCount || 0) + 1 });
      setStories(prev => prev.map(s => s.id === story.id ? upd(s) : s));
      setReadingStory(prev => prev && prev.id === story.id ? upd(prev) : prev);
    } catch (e) { alert('Rating error: ' + e.message); }
  };

  const fearPct = (s) => s.fearCount ? Math.round(((s.fearTotal || 0) / s.fearCount / 5) * 100) : 0;

  const spinWheel = () => {
    const last = parseInt(localStorage.getItem('lastSpin') || '0');
    if (Date.now() - last < 7 * 24 * 3600 * 1000) {
      const days = Math.ceil((7 * 24 * 3600 * 1000 - (Date.now() - last)) / (24 * 3600 * 1000));
      setWheelMsg('⏳ Is hafte ka spin ho chuka! ' + days + ' din baad wapas aao 🎰');
      return;
    }
    if (spinning) return;
    setSpinning(true); setWheelMsg('');
    const idx = Math.floor(Math.random() * 6);
    const base = wheelDeg - (wheelDeg % 360);
    setWheelDeg(base + 360 * 6 + (360 - (idx * 60 + 30)));
    setTimeout(() => {
      setSpinning(false);
      localStorage.setItem('lastSpin', String(Date.now()));
      if (idx === 0 || idx === 2) {
        const lockedPaid = stories.filter(s => s.price > 0 && !unlocked.includes(s.id));
        if (lockedPaid.length === 0) { setWheelMsg('🎉 Jeet gaye! Par saari kahaniyan pehle se unlocked hain!'); return; }
        const w = lockedPaid[Math.floor(Math.random() * lockedPaid.length)];
        doUnlock(w.id);
        setWheelMsg('🎉 FREE unlock ho gayi! 🎁');
      } else {
        setWheelMsg('😢 Agli baar kismat aazmaao!');
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
    const blob = new Blob([story.title + "\n\n" + story.text + "\n\n© Saya"], { type: 'text/plain' });
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
      ctx.fillStyle = '#0d0d12'; ctx.fillRect(0, 0, 720, 960);
      if (story.poster) {
        await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { ctx.drawImage(img, 0, 0, 720, 620); res(); };
          img.onerror = () => res();
          img.src = story.poster;
        });
      } else {
        ctx.fillStyle = '#1a0d05'; ctx.fillRect(0, 0, 720, 620);
        ctx.font = '160px serif'; ctx.textAlign = 'center'; ctx.fillText('👻', 360, 360);
      }
      const gr = ctx.createLinearGradient(0, 350, 0, 960);
      gr.addColorStop(0, 'rgba(13,13,18,0)'); gr.addColorStop(0.4, 'rgba(13,13,18,0.9)'); gr.addColorStop(1, '#0d0d12');
      ctx.fillStyle = gr; ctx.fillRect(0, 300, 720, 660);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Georgia';
      ctx.fillText(story.title.substring(0, 22), 360, 715);
      ctx.fillStyle = '#ffaa55'; ctx.font = 'italic 27px Georgia';
      ctx.fillText('Kya tum akele sun paoge?', 360, 775);
      ctx.fillStyle = '#ff6600'; ctx.font = 'bold 58px Georgia';
      ctx.fillText('SAYA', 360, 860);
      ctx.fillStyle = '#8a6a4a'; ctx.font = '22px sans-serif';
      ctx.fillText(window.location.origin.replace('https://', ''), 360, 908);
      canvas.toBlob(async (blob) => {
        if (!blob) return alert('Card ban nahi paya!');
        const file = new File([blob], 'saya-story.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: '👻 ' + story.title + ' - ' + window.location.origin }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'saya-story.png'; a.click();
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
    bg: dk ? '#0a0a10' : '#f4efe6',
    card: dk ? '#14141a' : '#fffaf2',
    border: dk ? '#2a2a35' : '#e0d3bd',
    text: dk ? '#fff' : '#221a10',
    sub: dk ? '#888' : '#8a7a62',
    nav: dk ? 'linear-gradient(180deg, rgba(10,10,16,0.98), rgba(10,10,16,0.85))' : 'linear-gradient(180deg, rgba(248,243,234,0.98), rgba(248,243,234,0.9))',
    navBorder: dk ? '#1a1a22' : '#e5dac5',
    footer: dk ? '#3a2a1a' : '#b5a58c'
  };

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' };
  const orgBtn = { backgroundColor: '#ff6600', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

  const langStories = stories.filter(s => (s.lang || 'hindi') === lang);
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
    @keyframes glow { 0%,100%{text-shadow:0 0 15px rgba(255,102,0,0.6)} 50%{text-shadow:0 0 35px rgba(255,102,0,1)} }
    @keyframes wob { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
    @keyframes heroFade { from{opacity:0.4;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
    @keyframes pulseNew { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .vbar{width:5px;background:#ff6600;border-radius:3px}
    .playing .b1{animation:bounce1 0.7s infinite}.playing .b2{animation:bounce2 0.5s infinite}.playing .b3{animation:bounce3 0.8s infinite}.playing .b4{animation:bounce2 0.6s infinite}.playing .b5{animation:bounce1 0.9s infinite}
    .sayaTitle{animation:glow 3s infinite}
    .wobble{display:inline-block;animation:wob 1.5s infinite}
    .heroImg{animation:heroFade 0.8s ease}
    .row{display:flex;overflow-x:auto;gap:12px;padding:12px 4px 18px;scrollbar-width:none;-ms-overflow-style:none}
    .row::-webkit-scrollbar{display:none}
    .card{transition:transform 0.25s ease,box-shadow 0.25s ease}
    .card:hover{transform:scale(1.06);box-shadow:0 6px 30px rgba(255,102,0,0.4);z-index:2}
    .card:hover img{filter:brightness(1.1)}
    .skel{background:linear-gradient(90deg,${dk ? '#14141a 25%,#20202a 50%,#14141a' : '#e8e0d0 25%,#f5efe3 50%,#e8e0d0'} 75%);background-size:800px 100%;animation:shimmer 1.3s infinite;border-radius:12px}
    .newBadge{animation:pulseNew 1.5s infinite}
    input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:5px;background:#3a2410;outline:none}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#ff6600;cursor:pointer;box-shadow:0 0 10px rgba(255,102,0,0.9)}
    .frame{border:4px solid #c9962e;border-radius:14px;position:relative;background:linear-gradient(180deg,#2a0d0d 0%,#1a0505 50%,#3d1408 100%);box-shadow:0 0 0 2px #6b4a12,0 0 0 6px #2a1a05,0 0 60px rgba(255,102,0,0.25),inset 0 0 40px rgba(0,0,0,0.8)}
    .frame:before{content:'💀';position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:2.2rem;filter:drop-shadow(0 0 10px rgba(255,150,0,0.8))}
    .frame .corner{position:absolute;font-size:1.1rem;opacity:0.9}
    .skullBtn{background:none;border:none;font-size:1.7rem;cursor:pointer;filter:grayscale(1);transition:all 0.2s}
    .rankNum{font-size:5.5rem;font-weight:900;color:transparent;-webkit-text-stroke:2px #ff6600;font-family:sans-serif;line-height:1;opacity:0.85}
    @keyframes batFly{0%{left:-60px;top:15%;transform:scaleX(1)}45%{top:8%}50%{left:105%;transform:scaleX(1)}51%{transform:scaleX(-1)}95%{top:20%}100%{left:-60px;top:15%;transform:scaleX(-1)}}
    .storyBat{position:fixed;font-size:1.8rem;z-index:101;pointer-events:none;animation:batFly 18s linear infinite;filter:drop-shadow(0 0 6px rgba(255,102,0,0.4))}
    @keyframes spiderDrop{0%,100%{transform:translateY(0)}50%{transform:translateY(45px)}}
    .spider{position:fixed;top:0;right:12%;z-index:101;pointer-events:none;animation:spiderDrop 6s ease-in-out infinite;text-align:center;font-size:1.2rem}
    .spider .thread{width:1px;height:60px;background:rgba(200,200,200,0.35);margin:0 auto}
    @keyframes fogMove{0%{transform:translateX(-25%)}100%{transform:translateX(25%)}}
    .fog{position:fixed;bottom:-30px;left:-20%;width:140%;height:130px;z-index:101;pointer-events:none;background:radial-gradient(ellipse at center,rgba(150,150,170,0.13),transparent 70%);animation:fogMove 9s ease-in-out infinite alternate}
    @keyframes darkPulse{0%,100%{box-shadow:inset 0 0 120px rgba(0,0,0,0.85)}50%{box-shadow:inset 0 0 200px rgba(0,0,0,0.97)}}
    .vignette{position:fixed;inset:0;z-index:99;pointer-events:none;animation:darkPulse 7s infinite}
    @keyframes eyesBlink{0%,88%,100%{opacity:0}90%,96%{opacity:0.8}}
    .eyes{position:fixed;bottom:18%;left:6%;z-index:101;pointer-events:none;font-size:1rem;animation:eyesBlink 11s infinite}
    .eyes2{left:auto;right:8%;bottom:30%;animation-delay:5s}
  `;

  const posterCard = (story, w) => (
    <div key={story.id} onClick={() => openStory(story)} className="card" style={{ minWidth: w, width: w, backgroundColor: C.card, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + C.border, cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      {story.poster ? (
        <img src={story.poster} alt={story.title} style={{ width: '100%', height: '190px', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ height: '190px', background: 'linear-gradient(135deg, #1a1005, #33200a)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem' }}>{story.audio ? '🔊' : '🎃'}</div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '25px 8px 6px' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{story.title}</h3>
        <p style={{ color: '#ffaa55', margin: '3px 0 0', fontSize: '0.68rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
      </div>
      {isNew(story) && <span className="newBadge" style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>NEW</span>}
      {story.price > 0 && !isUnlocked(story) && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,102,0,0.95)', color: '#fff', borderRadius: '20px', padding: '3px 8px', fontSize: '0.68rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
    </div>
  );

  return (
    <div style={{ backgroundColor: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.4s, color 0.4s' }}>
      <Head><title>Saya - Horror Stories 👻</title></Head>
      <style>{css}</style>

      <div style={{ filter: blurBg ? 'blur(8px)' : 'none', pointerEvents: blurBg ? 'none' : 'auto', transition: 'filter 0.3s' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', position: 'sticky', top: 0, zIndex: 50, background: C.nav, backdropFilter: 'blur(8px)', borderBottom: '1px solid ' + C.navBorder }}>
          <h1 className="sayaTitle" style={{ fontSize: '1.9rem', color: '#ff6600', margin: 0, letterSpacing: '3px', fontFamily: 'Georgia, serif' }}>SAYA 👻</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={toggleTheme} style={{ padding: '6px 10px', borderRadius: '18px', cursor: 'pointer', fontSize: '1rem', backgroundColor: 'transparent', border: '1px solid ' + C.border }}>{dk ? '☀️' : '🌙'}</button>
            <button onClick={() => setLang('hindi')} style={{ padding: '6px 14px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: lang === 'hindi' ? '#ff6600' : 'transparent', color: lang === 'hindi' ? '#fff' : C.sub, border: lang === 'hindi' ? 'none' : '1px solid ' + C.border }}>Hindi</button>
            <button onClick={() => setLang('english')} style={{ padding: '6px 14px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: lang === 'english' ? '#ff6600' : 'transparent', color: lang === 'english' ? '#fff' : C.sub, border: lang === 'english' ? 'none' : '1px solid ' + C.border }}>Eng</button>
            {!isAdmin && <button onClick={() => setShowLogin(true)} style={{ padding: '6px 10px', backgroundColor: 'transparent', color: C.sub, border: '1px solid ' + C.border, borderRadius: '18px', cursor: 'pointer', fontSize: '0.7rem', opacity: 0.6 }}>Admin</button>}
            {isAdmin && <button onClick={() => { setShowAdminMenu(true); loadPending(); }} style={{ ...orgBtn, padding: '7px 14px', fontSize: '0.8rem' }}>👑 Admin</button>}
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 14px' }}>

          {hero && (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginTop: '15px', border: '1px solid ' + C.border, cursor: 'pointer' }} onClick={() => openStory(hero)}>
              <img key={hero.id} src={hero.poster} alt={hero.title} className="heroImg" style={{ width: '100%', height: '46vw', maxHeight: '400px', minHeight: '220px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.9) 100%)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                {isNew(hero) && <span style={{ backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '3px 9px', fontSize: '0.7rem', fontWeight: 'bold' }}>NEW</span>}
                <h2 style={{ color: '#fff', margin: '8px 0 4px', fontSize: '1.7rem', fontFamily: 'Georgia, serif', textShadow: '2px 2px 10px #000' }}>{hero.title}</h2>
                <p style={{ color: '#ffaa55', margin: '0 0 12px', fontSize: '0.85rem' }}>👁️ {formatViews(hero.views)} {isEng ? 'views' : 'baar dekhi gayi'}{hero.fearCount ? ' • 😱 ' + fearPct(hero) + '%' : ''}{hero.price > 0 && !isUnlocked(hero) ? ' • 🔒 ₹' + hero.price : ''}</p>
                <button style={{ ...orgBtn, padding: '11px 30px', fontSize: '1rem', boxShadow: '0 0 20px rgba(255,102,0,0.5)' }}>{hero.audio ? '▶ ' + (isEng ? 'Listen Now' : 'Abhi Suno') : '📖 ' + (isEng ? 'Read Now' : 'Abhi Padho')}</button>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '15px', display: 'flex', gap: '6px' }}>
                {heroList.map((_, i) => (
                  <div key={i} style={{ width: i === heroIdx % heroList.length ? '20px' : '8px', height: '8px', borderRadius: '4px', backgroundColor: i === heroIdx % heroList.length ? '#ff6600' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }}></div>
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
              <h2 style={{ color: C.text, fontSize: '1.2rem', margin: '0 0 2px' }}>🔥 {isEng ? 'Most Watched' : 'Sabse zyada dekhi gayi'}</h2>
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
              <h2 style={{ color: C.text, fontSize: '1.2rem', margin: '0 0 2px' }}>🆕 {isEng ? 'New Stories' : 'Nayi kahaniyan'}</h2>
              <div className="row">
                {newest.map(story => posterCard(story, '140px'))}
              </div>
            </div>
          )}

          {!loading && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap' }}>
                <h2 style={{ color: C.text, fontSize: '1.2rem', margin: 0 }}>{isEng ? 'All Stories' : 'Sbi kahaniyan'}</h2>
                <button onClick={() => setTab('audio')} style={{ padding: '6px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: tab === 'audio' ? '#ff6600' : C.card, color: tab === 'audio' ? '#fff' : C.sub, border: tab === 'audio' ? 'none' : '1px solid ' + C.border }}>🔊 {isEng ? 'Listen' : 'Suno'}</button>
                <button onClick={() => setTab('text')} style={{ padding: '6px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: tab === 'text' ? '#ff6600' : C.card, color: tab === 'text' ? '#fff' : C.sub, border: tab === 'text' ? 'none' : '1px solid ' + C.border }}>📖 {isEng ? 'Read' : 'Padho'}</button>
              </div>

              {showList.length === 0 && <p style={{ color: C.sub, textAlign: 'center', padding: '30px' }}>{isEng ? 'No stories here yet...' : 'Abhi koi kahani nahi...'}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', paddingTop: '10px' }}>
                {showList.map((story) => (
                  <div key={story.id} onClick={() => openStory(story)} className="card" style={{ backgroundColor: C.card, borderRadius: '12px', overflow: 'hidden', border: '1px solid ' + C.border, cursor: 'pointer', position: 'relative' }}>
                    {story.poster ? (
                      <div style={{ position: 'relative' }}>
                        <img src={story.poster} alt={story.title} style={{ width: '100%', height: '210px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '28px 9px 7px' }}>
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '0.9rem', textShadow: '1px 1px 4px #000' }}>{story.title}</h3>
                          <p style={{ color: '#ffaa55', margin: '3px 0 0', fontSize: '0.7rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '210px', background: 'linear-gradient(135deg, #1a1005, #33200a)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        <span style={{ fontSize: '2.8rem' }}>{story.audio ? '🔊' : '🎃'}</span>
                        <h3 style={{ color: '#fff', margin: '10px 0 0', fontSize: '0.9rem', textAlign: 'center' }}>{story.title}</h3>
                        <p style={{ color: '#ffaa55', margin: '4px 0 0', fontSize: '0.7rem' }}>👁️ {formatViews(story.views)}</p>
                      </div>
                    )}
                    {isNew(story) && <span className="newBadge" style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#e50914', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 'bold' }}>NEW</span>}
                    {story.price > 0 && !isUnlocked(story) && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,102,0,0.95)', color: '#fff', borderRadius: '20px', padding: '3px 9px', fontSize: '0.7rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
                    {story.price > 0 && isUnlocked(story) && !isAdmin && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,170,0,0.9)', color: '#fff', borderRadius: '20px', padding: '3px 9px', fontSize: '0.7rem' }}>✅</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ color: C.footer, fontSize: '0.8rem', margin: '0 0 10px' }}>© Saya - Horror Stories 🎃</p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>
              <a href="/policy" style={{ color: '#ff8822', textDecoration: 'none', margin: '0 8px' }}>About</a>•
              <a href="/policy" style={{ color: '#ff8822', textDecoration: 'none', margin: '0 8px' }}>Contact</a>•
              <a href="/policy" style={{ color: '#ff8822', textDecoration: 'none', margin: '0 8px' }}>Privacy</a>•
              <a href="/policy" style={{ color: '#ff8822', textDecoration: 'none', margin: '0 8px' }}>Terms</a>•
              <a href="/policy" style={{ color: '#ff8822', textDecoration: 'none', margin: '0 8px' }}>Refund</a>
            </p>
          </div>
        </div>
      </div>

      {!blurBg && (
        <>
          <button onClick={() => { setShowWheel(true); setWheelMsg(''); }} className="wobble" style={{ position: 'fixed', bottom: '20px', left: '15px', zIndex: 90, backgroundColor: dk ? '#1a1410' : '#fff', border: '2px solid #ff6600', borderRadius: '50%', width: '56px', height: '56px', fontSize: '1.6rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,102,0,0.4)' }}>🎰</button>
          <button onClick={toggleAmb} style={{ position: 'fixed', bottom: '20px', right: '15px', zIndex: 90, backgroundColor: ambOn ? '#ff6600' : (dk ? '#1a1410' : '#fff'), border: '2px solid #ff6600', borderRadius: '50%', width: '56px', height: '56px', fontSize: '
