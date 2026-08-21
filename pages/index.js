import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { db, auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query, increment } from 'firebase/firestore';

const ADMIN_EMAIL = "vivaan2024koshiya@gmail.com";
const CLOUD_NAME = "wlse6ksh";
const UPLOAD_PRESET = "wlse6ksh";
// ⬇️ LINE 11: RAZORPAY KEY ⬇️
const RAZORPAY_KEY = "YAHAN_RAZORPAY_KEY_DALO";
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
  const audioRef = useRef(null);
  const ambRef = useRef(null);

  useEffect(() => {
    loadStories();
    onAuthStateChanged(auth, (u) => { setIsAdmin(!!u && u.email === ADMIN_EMAIL); });
    try { setUnlocked(JSON.parse(localStorage.getItem('unlocked') || '[]')); } catch (e) {}
    try { setFearVotes(JSON.parse(localStorage.getItem('fearVotes') || '{}')); } catch (e) {}
    try { setSharesCnt(JSON.parse(localStorage.getItem('sharesCnt') || '{}')); } catch (e) {}
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(s);
    const t = setInterval(() => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const diff = end - now;
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), sc = Math.floor((diff % 60000) / 1000);
      setOfferLeft(h + 'घं ' + m + 'मि ' + sc + 'से');
    }, 1000);
    return () => clearInterval(t);
  }, []);

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
    await deleteDoc(doc(db, "stories", id));
    loadStories();
  };

  const isUnlocked = (story) => !story.price || story.price === 0 || unlocked.includes(story.id) || isAdmin;

  const doUnlock = (id) => {
    const nu = [...unlocked, id];
    setUnlocked(nu); localStorage.setItem('unlocked', JSON.stringify(nu));
  };

  const payStory = (story) => {
    if (RAZORPAY_KEY.includes('YAHAN')) return alert('Razorpay Key abhi nahi dali gayi! Line 11 mein dalo.');
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY, amount: story.price * 100, currency: 'INR',
      name: 'साया - खौफ़ की कहानियाँ', description: story.title,
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
    if (cnt >= 5) { doUnlock(story.id); alert('🎉 5 shares पूरे! कहानी FREE unlock ho gayi!'); }
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
        setWheelMsg('🎉 बधाई हो! "' + w.title + '" FREE unlock ho gayi! 🎁');
      } else {
        setWheelMsg('😢 अगली बार किस्मत आज़माओ! (अगले हफ्ते फिर spin करना)');
      }
    }, 4300);
  };

  const toggleAmb = () => {
    if (AMBIENCE_URL.includes('YAHAN')) return alert('Ambience sound ka link abhi code mein nahi dala gaya!');
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
      ctx.fillText('क्या तुम अकेले सुन पाओगे?', 360, 775);
      ctx.fillStyle = '#ff6600'; ctx.font = 'bold 58px Georgia';
      ctx.fillText('साया', 360, 860);
      ctx.fillStyle = '#8a6a4a'; ctx.font = '22px sans-serif';
      ctx.fillText(window.location.origin.replace('https://', ''), 360, 908);
      canvas.toBlob(async (blob) => {
        if (!blob) return alert('Card ban nahi paya, dobara try karo!');
        const file = new File([blob], 'saaya-story.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: '👻 ' + story.title + ' - ' + window.location.origin }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'saaya-story.png'; a.click();
          URL.revokeObjectURL(url);
          alert('🖼️ Poster download ho gaya! Ab WhatsApp status par lagao!');
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

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' };
  const orgBtn = { backgroundColor: '#ff6600', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

  const langStories = stories.filter(s => (s.lang || 'hindi') === lang);
  const audioStories = langStories.filter(s => s.audio);
  const textStories = langStories.filter(s => s.text);
  const showList = tab === 'audio' ? audioStories : textStories;
  const blurBg = showLogin || (showPanel && isAdmin) || readingStory || showWheel;
  const isEng = lang === 'english';

  const css = `
    @keyframes bounce1 { 0%,100%{height:8px} 50%{height:26px} }
    @keyframes bounce2 { 0%,100%{height:20px} 50%{height:6px} }
    @keyframes bounce3 { 0%,100%{height:12px} 50%{height:30px} }
    @keyframes flyBat { 0%{transform:translateX(0) translateY(0)} 25%{transform:translateX(30px) translateY(-15px)} 50%{transform:translateX(60px) translateY(5px)} 75%{transform:translateX(30px) translateY(-10px)} 100%{transform:translateX(0) translateY(0)} }
    @keyframes glow { 0%,100%{text-shadow:0 0 20px rgba(255,102,0,0.6)} 50%{text-shadow:0 0 45px rgba(255,102,0,1)} }
    @keyframes flicker { 0%,100%{opacity:1} 45%{opacity:1} 50%{opacity:0.6} 55%{opacity:1} }
    @keyframes wob { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
    .vbar { width:5px; background:#ff6600; border-radius:3px; }
    .playing .b1 { animation: bounce1 0.7s infinite; } .playing .b2 { animation: bounce2 0.5s infinite; }
    .playing .b3 { animation: bounce3 0.8s infinite; } .playing .b4 { animation: bounce2 0.6s infinite; }
    .playing .b5 { animation: bounce1 0.9s infinite; }
    .bat { display:inline-block; animation: flyBat 5s infinite ease-in-out; }
    .bat2 { animation-duration: 7s; animation-delay: 1s; }
    .sayaTitle { animation: glow 3s infinite; }
    .pump { animation: flicker 4s infinite; }
    .wobble { display:inline-block; animation: wob 1.5s infinite; }
    input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:5px; background:#3a2410; outline:none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#ff6600; cursor:pointer; box-shadow:0 0 10px rgba(255,102,0,0.9); }
    .frame { border: 4px solid #c9962e; border-radius: 14px; position: relative;
      background: linear-gradient(180deg, #2a0d0d 0%, #1a0505 50%, #3d1408 100%);
      box-shadow: 0 0 0 2px #6b4a12, 0 0 0 6px #2a1a05, 0 0 60px rgba(255,102,0,0.25), inset 0 0 40px rgba(0,0,0,0.8); }
    .frame:before { content:'💀'; position:absolute; top:-24px; left:50%; transform:translateX(-50%);
      font-size:2.2rem; filter: drop-shadow(0 0 10px rgba(255,150,0,0.8)); }
    .frame .corner { position:absolute; font-size:1.1rem; opacity:0.9; }
    .skullBtn { background:none; border:none; font-size:1.7rem; cursor:pointer; filter:grayscale(1); transition: all 0.2s; }
    .skullBtn.on { filter:grayscale(0); transform:scale(1.15); }
  `;

  return (
    <div style={{ backgroundColor: '#0a0a10', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head><title>साया - खौफ़ की हिंदी कहानियाँ 👻</title></Head>
      <style>{css}</style>

      <div style={{ filter: blurBg ? 'blur(8px)' : 'none', pointerEvents: blurBg ? 'none' : 'auto', transition: 'filter 0.3s' }}>

        <div style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #1a0d05 70%, #0a0a10 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden', paddingBottom: '10px' }}>
          <div className="bat" style={{ position: 'absolute', top: '30px', left: '12%', fontSize: '1.6rem' }}>🦇</div>
          <div className="bat bat2" style={{ position: 'absolute', top: '70px', right: '18%', fontSize: '1.2rem' }}>🦇</div>
          <div className="bat" style={{ position: 'absolute', top: '110px', left: '25%', fontSize: '1rem' }}>🦇</div>

          <div style={{ position: 'relative', width: '230px', height: '230px', margin: '35px auto 0' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 38% 35%, #ffe38a 0%, #ffb339 40%, #ff7b00 75%, #cc4d00 100%)', boxShadow: '0 0 90px rgba(255,140,0,0.55), 0 0 180px rgba(255,100,0,0.25)' }}></div>
            <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '5rem', filter: 'brightness(0.25) contrast(1.4)' }}>🏰</div>
            <div style={{ position: 'absolute', top: '35px', right: '18px', fontSize: '1.1rem' }}>🦇</div>
          </div>

          <div style={{ position: 'absolute', bottom: '55px', left: '-15px', fontSize: '4.5rem', filter: 'brightness(0.2)', transform: 'scaleX(-1)' }}>🌳</div>
          <div style={{ position: 'absolute', bottom: '55px', right: '-15px', fontSize: '4.5rem', filter: 'brightness(0.2)' }}>🌳</div>

          <h1 className="sayaTitle" style={{ fontSize: '3.6rem', color: '#ff6600', margin: '18px 0 0', letterSpacing: '6px', fontFamily: 'Georgia, serif' }}>साया</h1>
          <p style={{ color: '#ffaa55', marginTop: '4px', fontSize: '1.15rem', letterSpacing: '2px' }}>{isEng ? 'Horror Stories in English' : 'खौफ़ की हिंदी कहानियाँ'}</p>
          <p style={{ color: '#8a6a4a', marginTop: '5px', fontSize: '0.85rem', fontStyle: 'italic' }}>{isEng ? '"Fear is just one story away..."' : '"डर सिर्फ एक कहानी की दूरी पर है..."'}</p>

          <div style={{ marginTop: '12px', fontSize: '1.9rem', letterSpacing: '12px' }}>
            <span className="pump">🎃</span><span className="pump" style={{ animationDelay: '1s' }}>🎃</span><span className="pump" style={{ animationDelay: '2s' }}>🎃</span>
          </div>

          {!isAdmin && <div><button onClick={() => setShowLogin(true)} style={{ marginTop: '10px', padding: '5px 14px', backgroundColor: 'transparent', color: '#4a3a2a', border: '1px solid #2a2015', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>Admin</button></div>}
          {isAdmin && <div><button onClick={() => setShowPanel(true)} style={{ ...orgBtn, marginTop: '12px', padding: '10px 25px' }}>📝 Story Add/Manage Karo</button></div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', paddingTop: '18px' }}>
          <button onClick={() => setLang('hindi')} style={{ padding: '8px 26px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', backgroundColor: lang === 'hindi' ? '#ff6600' : '#14141a', color: lang === 'hindi' ? '#fff' : '#777', border: lang === 'hindi' ? 'none' : '1px solid #2a2a35' }}>हिंदी</button>
          <button onClick={() => setLang('english')} style={{ padding: '8px 26px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', backgroundColor: lang === 'english' ? '#ff6600' : '#14141a', color: lang === 'english' ? '#fff' : '#777', border: lang === 'english' ? 'none' : '1px solid #2a2a35' }}>English</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px 15px 5px', maxWidth: '500px', margin: '0 auto' }}>
          <div onClick={() => setTab('audio')} style={{ flex: 1, textAlign: 'center', padding: '18px 10px', borderRadius: '16px', cursor: 'pointer', background: tab === 'audio' ? 'linear-gradient(145deg, #8a3d00, #4d2200)' : '#14141a', border: tab === 'audio' ? '2px solid #ff6600' : '2px solid #26262e', boxShadow: tab === 'audio' ? '0 0 22px rgba(255,102,0,0.4)' : 'none' }}>
            <div style={{ fontSize: '2.3rem' }}>🔊</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px', color: tab === 'audio' ? '#fff' : '#777' }}>{isEng ? 'Listen' : 'सुनो'}</div>
            <div style={{ fontSize: '0.75rem', color: tab === 'audio' ? '#ffcc99' : '#4a4a55', marginTop: '3px' }}>{isEng ? 'Audio Stories' : 'ऑडियो कहानियाँ'}</div>
          </div>
          <div onClick={() => setTab('text')} style={{ flex: 1, textAlign: 'center', padding: '18px 10px', borderRadius: '16px', cursor: 'pointer', background: tab === 'text' ? 'linear-gradient(145deg, #8a3d00, #4d2200)' : '#14141a', border: tab === 'text' ? '2px solid #ff6600' : '2px solid #26262e', boxShadow: tab === 'text' ? '0 0 22px rgba(255,102,0,0.4)' : 'none' }}>
            <div style={{ fontSize: '2.3rem' }}>📖</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px', color: tab === 'text' ? '#fff' : '#777' }}>{isEng ? 'Read' : 'पढ़ो'}</div>
            <div style={{ fontSize: '0.75rem', color: tab === 'text' ? '#ffcc99' : '#4a4a55', marginTop: '3px' }}>{isEng ? 'Written Stories' : 'लिखी कहानियाँ'}</div>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px' }}>
          {loading && <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading... 🎃</p>}
          {!loading && showList.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>{isEng ? 'No stories here yet...' : (tab === 'audio' ? '🔊 अभी कोई ऑडियो कहानी नहीं...' : '📖 अभी कोई लिखी कहानी नहीं...')}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {showList.map((story) => (
              <div key={story.id} onClick={() => openStory(story)} style={{ backgroundColor: '#14141a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a35', cursor: 'pointer', position: 'relative' }}>
                {story.poster ? (
                  <div style={{ position: 'relative' }}>
                    <img src={story.poster} alt={story.title} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '30px 10px 8px' }}>
                      <h3 style={{ color: '#fff', margin: 0, fontSize: '0.95rem', textShadow: '1px 1px 4px #000' }}>{story.title}</h3>
                      <p style={{ color: '#ffaa55', margin: '4px 0 0', fontSize: '0.72rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '220px', background: 'linear-gradient(135deg, #1a1005, #33200a)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                    <span style={{ fontSize: '3rem' }}>{story.audio ? '🔊' : '🎃'}</span>
                    <h3 style={{ color: '#fff', margin: '10px 0 0', fontSize: '0.95rem', textAlign: 'center' }}>{story.title}</h3>
                    <p style={{ color: '#ffaa55', margin: '4px 0 0', fontSize: '0.72rem' }}>👁️ {formatViews(story.views)}{story.fearCount ? ' • 😱 ' + fearPct(story) + '%' : ''}</p>
                  </div>
                )}
                {story.price > 0 && !isUnlocked(story) && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,102,0,0.95)', color: '#fff', borderRadius: '20px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
                {story.price > 0 && isUnlocked(story) && !isAdmin && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,170,0,0.9)', color: '#fff', borderRadius: '20px', padding: '4px 10px', fontSize: '0.75rem' }}>✅</span>}
                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); startEdit(story); }} style={{ backgroundColor: 'rgba(255,170,0,0.9)', color: '#000', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); removeStory(story.id); }} style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff4444', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: '#3a2a1a', padding: '30px 0', fontSize: '0.8rem' }}>© साया - खौफ़ की हिंदी कहानियाँ 🎃</p>
        </div>
      </div>

      {!blurBg && (
        <>
          <button onClick={() => { setShowWheel(true); setWheelMsg(''); }} className="wobble" style={{ position: 'fixed', bottom: '20px', left: '15px', zIndex: 90, backgroundColor: '#1a1410', border: '2px solid #ff6600', borderRadius: '50%', width: '58px', height: '58px', fontSize: '1.7rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,102,0,0.4)' }}>🎰</button>
          <button onClick={toggleAmb} style={{ position: 'fixed', bottom: '20px', right: '15px', zIndex: 90, backgroundColor: ambOn ? '#ff6600' : '#1a1410', border: '2px solid #ff6600', borderRadius: '50%', width: '58px', height: '58px', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,102,0,0.4)' }}>{ambOn ? '🔊' : '🔇'}</button>
        </>
      )}

      {showWheel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120, padding: '20px' }} onClick={() => !spinning && setShowWheel(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a1410', padding: '25px', borderRadius: '16px', border: '2px solid #ff6600', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 0 40px rgba(255,102,0,0.3)' }}>
            <h2 style={{ color: '#ff8822', marginTop: 0 }}>🎰 किस्मत का पहिया</h2>
            <p style={{ color: '#c9a97a', fontSize: '0.85rem', marginTop: '-5px' }}>हफ्ते में 1 बार घुमाओ — FREE कहानी जीतो!</p>
            <div style={{ position: 'relative', width: '250px', height: '250px', margin: '15px auto' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 2 }}>🔻</div>
              <div style={{ width: '250px', height: '250px', borderRadius: '50%', border: '6px solid #c9962e', boxSizing: 'border-box', background: 'conic-gradient(#ff6600 0deg 60deg, #1a1a22 60deg 120deg, #ff6600 120deg 180deg, #1a1a22 180deg 240deg, #2a1a0a 240deg 300deg, #1a1a22 300deg 360deg)', transform: `rotate(${wheelDeg}deg)`, transition: 'transform 4s cubic-bezier(0.15,0.85,0.25,1)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: '#1a1410', border: '3px solid #c9962e', borderRadius: '50%', width: '55px', height: '55px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem' }}>👻</div>
            </div>
            <p style={{ color: '#8a6a4a', fontSize: '0.8rem' }}>🧡 नारंगी हिस्सा = 🎁 FREE कहानी</p>
            <button onClick={spinWheel} disabled={spinning} style={{ ...orgBtn, padding: '14px 40px', fontSize: '1.1rem', opacity: spinning ? 0.5 : 1 }}>{spinning ? 'घूम रहा है...' : '🎡 घुमाओ!'}</button>
            {wheelMsg && <p style={{ color: '#ffaa55', marginTop: '15px', fontSize: '0.95rem' }}>{wheelMsg}</p>}
            {!spinning && <p onClick={() => setShowWheel(false)} style={{ color: '#555', marginTop: '12px', fontSize: '0.8rem', cursor: 'pointer' }}>बंद करो ✕</p>}
          </div>
        </div>
      )}

      {readingStory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,2,0,0.6)', zIndex: 100, overflowY: 'auto', padding: '15px' }}>
          <div style={{ maxWidth: '650px', margin: '35px auto 30px' }}>
            <div className="frame" style={{ padding: '35px 18px 25px' }}>
              <span className="corner" style={{ top: '6px', left: '8px' }}>🕸️</span>
              <span className="corner" style={{ top: '6px', right: '8px' }}>🕸️</span>
              <span className="corner" style={{ bottom: '6px', left: '8px' }}>🦴</span>
              <span className="corner" style={{ bottom: '6px', right: '8px' }}>🦴</span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => { setReadingStory(null); setPlaying(false); setCurTime(0); setDuration(0); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#c9962e', border: '1px solid #6b4a12', borderRadius: '8px', cursor: 'pointer' }}>← वापस</button>
                <button onClick={() => shareStory(readingStory)} style={{ padding: '8px 16px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📤 Share</button>
                <button onClick={() => shareCardImg(readingStory)} style={{ padding: '8px 16px', backgroundColor: '#5c3a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖼️ Poster Share</button>
              </div>

              {readingStory.poster && (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px', border: '2px solid #6b4a12' }}>
                  <img src={readingStory.poster} alt={readingStory.title} style={{ width: '100%', display: 'block', filter: isUnlocked(readingStory) ? 'none' : 'blur(6px)' }} />
                </div>
              )}
              <h1 style={{ color: '#ff8822', margin: '0 0 5px', fontSize: '1.6rem', textAlign: 'center', fontFamily: 'Georgia, serif', textShadow: '0 0 15px rgba(255,120,0,0.5)' }}>{readingStory.title}</h1>
              <p style={{ color: '#8a6a4a', textAlign: 'center', margin: '0 0 15px', fontSize: '0.85rem' }}>👁️ {formatViews((readingStory.views || 0) + 1)} बार देखी गई{readingStory.fearCount ? ' • 😱 ' + fearPct(readingStory) + '% लोगों को डर लगा' : ''}</p>

              {!isUnlocked(readingStory) && (
                <div style={{ textAlign: 'center', padding: '15px 10px' }}>
                  <div style={{ fontSize: '3.5rem' }}>🔒</div>
                  <h2 style={{ color: '#ff8822', margin: '10px 0' }}>यह प्रीमियम कहानी है</h2>

                  <div style={{ backgroundColor: 'rgba(255,102,0,0.12)', border: '1px dashed #ff6600', borderRadius: '10px', padding: '10px', margin: '10px auto', maxWidth: '320px' }}>
                    <p style={{ color: '#ffaa55', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>⚡ आज का ऑफर खत्म होने में:</p>
                    <p style={{ color: '#ff4444', margin: '5px 0 0', fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{offerLeft}</p>
                    <p style={{ color: '#c9a97a', margin: '5px 0 0', fontSize: '1rem' }}><s style={{ color: '#777' }}>₹{readingStory.price * 2}</s> <span style={{ color: '#00cc44', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{readingStory.price}</span></p>
                  </div>

                  <button onClick={() => payStory(readingStory)} style={{ ...orgBtn, padding: '16px 40px', fontSize: '1.15rem', marginTop: '5px', boxShadow: '0 0 25px rgba(255,102,0,0.4)' }}>💳 ₹{readingStory.price} देकर अनलॉक करो</button>

                  <p style={{ color: '#666', margin: '15px 0 8px' }}>—— या ——</p>
                  <button onClick={() => shareUnlock(readingStory)} style={{ padding: '13px 28px', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>🎁 5 दोस्तों को Share करो, FREE पाओ ({sharesCnt[readingStory.id] || 0}/5)</button>
                  <p style={{ color: '#8a6a4a', fontSize: '0.75rem', marginTop: '8px' }}>WhatsApp par 5 baar share karo aur kahani free unlock!</p>
                </div>
              )}

              {isUnlocked(readingStory) && (
                <>
                  {readingStory.audio && (
                    <div className={playing ? 'playing' : ''} style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '20px', marginBottom: '15px', border: '1px solid #6b4a12', textAlign: 'center' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9a97a', fontSize: '0.8rem', marginTop: '5px' }}>
                        <span>{formatTime(curTime)}</span><span>{formatTime(duration)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px', marginTop: '14px' }}>
                        <button onClick={() => skip(-10)} style={{ backgroundColor: '#2a1a0a', color: '#c9962e', border: '1px solid #6b4a12', borderRadius: '50%', width: '52px', height: '52px', fontSize: '0.8rem', cursor: 'pointer' }}>-10s</button>
                        <button onClick={togglePlay} style={{ backgroundColor: '#ff6600', color: 'white', border: 'none', borderRadius: '50%', width: '72px', height: '72px', fontSize: '1.7rem', cursor: 'pointer', boxShadow: '0 0 25px rgba(255,102,0,0.7)' }}>{playing ? '⏸' : '▶'}</button>
                        <button onClick={() => skip(10)} style={{ backgroundColor: '#2a1a0a', color: '#c9962e', border: '1px solid #6b4a12', borderRadius: '50%', width: '52px', height: '52px', fontSize: '0.8rem', cursor: 'pointer' }}>+10s</button>
                      </div>
                      <button onClick={() => downloadAudio(readingStory)} style={{ ...orgBtn, padding: '11px 26px', marginTop: '16px', fontSize: '0.9rem' }}>⬇️ ऑडियो डाउनलोड करो</button>
                      <p style={{ color: '#8a6a4a', marginTop: '12px', marginBottom: 0, fontSize: '0.82rem' }}>🎧 हेडफ़ोन लगाओ... अकेले मत सुनना</p>
                    </div>
                  )}

                  {readingStory.text && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <button onClick={() => downloadText(readingStory)} style={{ ...orgBtn, padding: '9px 22px', marginBottom: '14px', fontSize: '0.85rem' }}>⬇️ कहानी डाउनलोड करो</button>
                      </div>
                      <div style={{ color: '#e8d5b8', lineHeight: '2', fontSize: '1.1rem', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', padding: '5px 8px 10px' }}>{readingStory.text}</div>
                    </>
                  )}

                  <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '15px', marginTop: '10px', border: '1px solid #6b4a12', textAlign: 'center' }}>
                    <p style={{ color: '#ff8822', margin: '0 0 8px', fontWeight: 'bold' }}>😱 कितना डर लगा?</p>
                    {fearVotes[readingStory.id] ? (
                      <p style={{ color: '#c9a97a', margin: 0, fontSize: '0.9rem' }}>आपने {fearVotes[readingStory.id]} 💀 दिए! • {fearPct(readingStory)}% लोगों को डर लगा</p>
                    ) : (
                      <div>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} className="skullBtn" onClick={() => rateFear(readingStory, n)}>💀</button>
                        ))}
                        <p style={{ color: '#666', margin: '5px 0 0', fontSize: '0.75rem' }}>(1 = थोड़ा डर, 5 = बहुत डर!)</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowLogin(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a1410', padding: '30px', borderRadius: '16px', border: '2px solid #ff6600', width: '100%', maxWidth: '350px', boxShadow: '0 0 40px rgba(255,102,0,0.3)' }}>
            <h2 style={{ color: '#ff8822', marginTop: 0, textAlign: 'center' }}>🔐 Admin Login</h2>
            <p style={{ color: '#8a6a4a', fontSize: '0.85rem', textAlign: 'center' }}>Sirf admin ka Google account chalega</p>
            <button onClick={handleLogin} style={{ ...orgBtn, width: '100%', padding: '14px', fontSize: '1rem' }}>🔑 Google Se Login Karo</button>
          </div>
        </div>
      )}

      {showPanel && isAdmin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 100, padding: '20px', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#1a1410', padding: '25px', borderRadius: '16px', border: editId ? '2px solid #ffaa00' : '2px solid #ff6600', width: '100%', maxWidth: '550px', margin: '20px 0', boxShadow: '0 0 40px rgba(255,102,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: editId ? '#ffaa00' : '#ff8822', margin: 0, fontSize: '1.3rem' }}>{editId ? '✏️ Edit Story' : '📝 Nayi Story'}</h2>
              <button onClick={() => { setShowPanel(false); clearForm(); }} style={{ backgroundColor: '#332818', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ marginTop: '15px' }}>
              <input type="text" placeholder="Title (zaroori)" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
              <label style={{ color: '#ffaa55', fontSize: '0.85rem' }}>🌐 Language:</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', marginTop: '5px' }}>
                <button onClick={() => setStoryLang('hindi')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: storyLang === 'hindi' ? '#ff6600' : '#0a0a0a', color: storyLang === 'hindi' ? '#fff' : '#777', border: '1px solid #444' }}>हिंदी</button>
                <button onClick={() => setStoryLang('english')} style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: storyLang === 'english' ? '#ff6600' : '#0a0a0a', color: storyLang === 'english' ? '#fff' : '#777', border: '1px solid #444' }}>English</button>
              </div>
              <label style={{ color: '#ffaa55', fontSize: '0.85rem' }}>🖼️ Poster Upload Karo:</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'poster')} style={{ ...inputStyle, padding: '8px' }} />
              {uploading === 'poster' && <p style={{ color: '#ffaa00', margin: '0 0 10px' }}>⏳ Poster upload ho raha hai...</p>}
              {poster && <img src={poster} style={{ width: '80px', borderRadius: '8px', marginBottom: '10px' }} />}
              <label style={{ color: '#ffaa55', fontSize: '0.85rem' }}>🔊 Audio Upload Karo (MP3):</label>
              <input type="file" accept="audio/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0], 'audio')} style={{ ...inputStyle, padding: '8px' }} />
              {uploading === 'audio' && <p style={{ color: '#ffaa00', margin: '0 0 10px' }}>⏳ Audio upload ho raha hai...</p>}
              {audio && <p style={{ color: '#00cc00', margin: '0 0 10px', fontSize: '0.8rem' }}>✅ Audio ready hai</p>}
              <textarea placeholder="Story Text (audio-only ho toh khali chhodo)" value={text} onChange={(e) => setText(e.target.value)} rows="6" style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', marginRight: '10px' }}>💰 Price ₹ (0 = Free):</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100px', padding: '10px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px' }} />
              </div>
              <button onClick={saveStory} disabled={!!uploading} style={{ ...orgBtn, width: '100%', padding: '15px', fontSize: '1.05rem', backgroundColor: editId ? '#ffaa00' : '#ff6600', color: editId ? '#000' : '#fff', opacity: uploading ? 0.5 : 1 }}>{editId ? '✏️ Update Karo' : '✅ Publish Karo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
