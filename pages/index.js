import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, orderBy, query } from 'firebase/firestore';

// ===== RAZORPAY KEY YAHAN DAALO =====
const RAZORPAY_KEY = "rzp_test_yaari_key_yahan_dalo";
const ADMIN_PASSWORD = "bhoot123";
const CLOUDINARY_CLOUD = "wlse6ksh";
const CLOUDINARY_PRESET = "wlse6ksh";

// ===== HOME BACKGROUND IMAGE (OPTIONAL) =====
// Agar apna darawana background lagana hai to Cloudinary pe upload karke
// uska URL yahan daalo. Khali chhodo to CSS wala spooky background aayega.
const HOME_BG_IMAGE = "";

// ===== GLOBAL CSS (animations + horror frame) =====
const GLOBAL_CSS = `
  @keyframes fly {
    0% { transform: translateX(-150px) translateY(0) rotate(-5deg); }
    50% { transform: translateX(55vw) translateY(-40px) rotate(5deg); }
    100% { transform: translateX(115vw) translateY(20px) rotate(-3deg); }
  }
  .bat { position: absolute; animation: fly 12s linear infinite; opacity: 0.6; z-index: 1; }

  @keyframes fogMove { 0% { transform: translateX(-8%); } 100% { transform: translateX(8%); } }
  .fog {
    position: absolute; bottom: 0; left: -10%; right: -10%; height: 180px;
    background: radial-gradient(ellipse at center, rgba(180,180,200,0.12) 0%, transparent 70%);
    filter: blur(20px); animation: fogMove 15s ease-in-out infinite alternate; z-index: 1;
  }
  .fog2 {
    position: absolute; bottom: 0; left: -10%; right: -10%; height: 120px;
    background: radial-gradient(ellipse at center, rgba(150,150,180,0.1) 0%, transparent 70%);
    filter: blur(25px); animation: fogMove 20s ease-in-out infinite alternate-reverse; z-index: 1;
  }

  @keyframes flicker {
    0%, 100% { text-shadow: 0 0 20px rgba(255,0,0,0.9), 0 0 45px rgba(255,0,0,0.5), 0 0 80px rgba(255,0,0,0.3); opacity: 1; }
    45% { text-shadow: 0 0 12px rgba(255,0,0,0.5); opacity: 0.9; }
    46% { opacity: 0.6; } 47% { opacity: 1; }
    90% { opacity: 1; } 91% { opacity: 0.7; } 92% { opacity: 1; }
  }
  .spooky-title { animation: flicker 4s infinite; }

  .story-frame {
    position: relative;
    background: linear-gradient(160deg, #1e1010 0%, #130808 50%, #1e1010 100%);
    border: 4px double #7a2525; border-radius: 14px; padding: 35px 22px;
    box-shadow: 0 0 50px rgba(0,0,0,0.9), inset 0 0 45px rgba(90,25,25,0.35);
  }
  .story-frame .corner { position: absolute; font-size: 1.5rem; opacity: 0.75; }
  .story-frame .tl { top: 6px; left: 10px; }
  .story-frame .tr { top: 6px; right: 10px; }
  .story-frame .bl { bottom: 6px; left: 10px; }
  .story-frame .br { bottom: 6px; right: 10px; }
  .story-title {
    color: #ff3333; text-align: center; font-family: Georgia, serif;
    font-size: 1.7rem; margin-bottom: 18px; text-shadow: 0 0 15px rgba(255,0,0,0.5);
  }
  .story-text {
    color: #e8d8c8; line-height: 2; font-size: 1.1rem;
    font-family: Georgia, serif; white-space: pre-wrap;
  }

  input[type=range] { -webkit-appearance:none; width:100%; height:6px; border-radius:5px; background:#333; outline:none; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#ff2222; cursor:pointer; box-shadow:0 0 8px rgba(255,0,0,0.8); }

  @keyframes bounce1 { 0%,100%{height:8px} 50%{height:26px} }
  @keyframes bounce2 { 0%,100%{height:20px} 50%{height:6px} }
  @keyframes bounce3 { 0%,100%{height:12px} 50%{height:30px} }
  .vbar { width:5px; background:#ff2222; border-radius:3px; }
  .playing .b1 { animation: bounce1 0.7s infinite; }
  .playing .b2 { animation: bounce2 0.5s infinite; }
  .playing .b3 { animation: bounce3 0.8s infinite; }
  .playing .b4 { animation: bounce2 0.6s infinite; }
  .playing .b5 { animation: bounce1 0.9s infinite; }
`;

// ===== SPOOKY BACKGROUND (moon + bats + fog) =====
function SpookyBG({ blurred = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0,
      transform: 'scale(1.1)',
      filter: blurred ? 'blur(14px) brightness(0.4)' : 'none',
      background: HOME_BG_IMAGE
        ? `linear-gradient(rgba(5,2,8,0.55), rgba(5,2,8,0.75)), url(${HOME_BG_IMAGE}) center/cover no-repeat`
        : 'linear-gradient(to bottom, #080410 0%, #150a18 35%, #2a0d0d 70%, #180606 100%)'
    }}>
      <div style={{
        position: 'absolute', top: '7%', right: '9%',
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fff8e0, #ffd980 45%, #ff9933 85%)',
        boxShadow: '0 0 50px 18px rgba(255,180,80,0.5), 0 0 110px 45px rgba(255,140,40,0.25)'
      }} />
      <div className="bat" style={{ top: '14%', fontSize: '1.6rem', animationDelay: '0s' }}>🦇</div>
      <div className="bat" style={{ top: '24%', fontSize: '1.1rem', animationDelay: '4s' }}>🦇</div>
      <div className="bat" style={{ top: '10%', fontSize: '2rem', animationDelay: '8s' }}>🦇</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
      <div className="fog" />
      <div className="fog2" />
    </div>
  );
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

export default function Home() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [poster, setPoster] = useState('');
  const [audio, setAudio] = useState('');
  const [price, setPrice] = useState('0');
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('audio');
  const [readingStory, setReadingStory] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingStory, setPayingStory] = useState(null);
  const [paying, setPaying] = useState(false);
  const [unlocked, setUnlocked] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    loadStories();
    const saved = localStorage.getItem('unlockedStories');
    if (saved) setUnlocked(JSON.parse(saved));
  }, []);

  const loadStories = async () => {
    try {
      const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setIsAdmin(true); setShowLogin(false); setPassword(''); }
    else { alert('Galat password!'); }
  };

  const uploadFile = async (file, folder) => {
    if (!file) return '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      fd.append('folder', folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      setUploading(false);
      return data.secure_url;
    } catch (e) {
      setUploading(false);
      alert('Upload fail: ' + e.message);
      return '';
    }
  };

  const onPosterFile = async (e) => { const f = e.target.files[0]; if (f) { const u = await uploadFile(f, 'posters'); if (u) setPoster(u); } };
  const onAudioFile = async (e) => { const f = e.target.files[0]; if (f) { const u = await uploadFile(f, 'audio'); if (u) setAudio(u); } };

  const clearForm = () => { setTitle(''); setText(''); setPoster(''); setAudio(''); setPrice('0'); setEditId(null); };

  const saveStory = async () => {
    if (!title) return alert('Title toh likho bhai!');
    if (!text && !audio) return alert('Ya toh Story Text likho, ya Audio upload karo!');
    try {
      if (editId) {
        await updateDoc(doc(db, "stories", editId), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0 });
        alert('Update ho gayi! ✏️');
      } else {
        await addDoc(collection(db, "stories"), { title, text: text || '', poster: poster || '', audio: audio || '', price: parseInt(price) || 0, createdAt: Date.now(), date: new Date().toLocaleDateString('hi-IN') });
        alert('Publish ho gayi! 👻');
      }
      clearForm(); loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const startEdit = (story) => {
    setEditId(story.id); setTitle(story.title || ''); setText(story.text || '');
    setPoster(story.poster || ''); setAudio(story.audio || ''); setPrice(String(story.price || 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeStory = async (id) => {
    if (!confirm('Pakka delete karna hai?')) return;
    await deleteDoc(doc(db, "stories", id));
    loadStories();
  };

  const openStory = (story) => { setReadingStory(story); setCurTime(0); setDuration(0); setPlaying(false); };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { const p = a.play(); if (p) { p.then(() => setPlaying(true)).catch(() => alert('Audio load nahi ho paayi!')); } else { setPlaying(true); } }
  };

  const skip = (sec) => { if (audioRef.current) audioRef.current.currentTime += sec; };
  const onSeek = (e) => { const val = parseFloat(e.target.value); if (audioRef.current) audioRef.current.currentTime = val; setCurTime(val); };

  const downloadFile = (story) => {
    try {
      const a = document.createElement('a');
      if (story.audio) { a.href = story.audio; a.download = story.title.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_') + '.mp3'; }
      else { const blob = new Blob([story.text], { type: 'text/plain;charset=utf-8' }); a.href = URL.createObjectURL(blob); a.download = story.title.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_') + '.txt'; }
      a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      alert('Download shuru! ✅ Offline sun/padh sakte ho.');
    } catch (e) { alert('Download fail: ' + e.message); }
  };

  const startPayment = (story) => { setPayingStory(story); setShowPayModal(true); };

  const handlePayment = () => {
    if (!payingStory) return;
    setPaying(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: RAZORPAY_KEY, amount: payingStory.price * 100, currency: 'INR',
        name: 'साया', description: payingStory.title + ' - Unlock',
        handler: () => {
          const u = [...unlocked, payingStory.id];
          setUnlocked(u); localStorage.setItem('unlockedStories', JSON.stringify(u));
          setShowPayModal(false); setPaying(false);
          alert('Payment success! ✅ Ab suno ya download karo.');
        },
        prefill: { name: 'User' }, theme: { color: '#ff2222' }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setPaying(false); alert('Payment fail ho gaya. Dobara try karo.'); });
      rzp.open();
    };
    script.onerror = () => { setPaying(false); alert('Razorpay load nahi hui. Internet check karo.'); };
    document.body.appendChild(script);
  };

  const isUnlocked = (id) => unlocked.includes(id);
  const isFree = (s) => s.price === 0;
  const canAccess = (s) => isFree(s) || isUnlocked(s.id);

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' };

  const audioStories = stories.filter(s => s.audio);
  const textStories = stories.filter(s => s.text);
  const showList = tab === 'audio' ? audioStories : textStories;

  // ================= STORY PAGE (horror frame + blurred bg) =================
  if (readingStory) {
    const canPlay = canAccess(readingStory);
    return (
      <div style={{ position: 'relative', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
        <style>{GLOBAL_CSS}</style>
        <SpookyBG blurred />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', margin: '0 auto', padding: '15px' }}>
          <button onClick={() => { setReadingStory(null); setPlaying(false); setCurTime(0); setDuration(0); }}
            style={{ padding: '10px 20px', backgroundColor: '#222', color: '#ff6666', border: '1px solid #5a1a1a', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>
            ← वापस
          </button>

          {readingStory.poster && (
            <img src={readingStory.poster} alt={readingStory.title}
              style={{ width: '100%', borderRadius: '14px', marginBottom: '18px', display: 'block', border: '2px solid #4a1515', boxShadow: '0 0 25px rgba(0,0,0,0.7)' }} />
          )}

          {canPlay ? (
            <div className="story-frame">
              <span className="corner tl">💀</span>
              <span className="corner tr">💀</span>
              <span className="corner bl">🕸️</span>
              <span className="corner br">🕸️</span>

              <h1 className="story-title">{readingStory.title}</h1>

              {readingStory.audio && (
                <div className={playing ? 'playing' : ''} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '12px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
                  <audio ref={audioRef} src={readingStory.audio} preload="metadata" playsInline
                    onTimeUpdate={() => setCurTime(audioRef.current ? audioRef.current.currentTime : 0)}
                    onLoadedMetadata={() => setDuration(audioRef.current ? audioRef.current.duration : 0)}
                    onEnded={() => setPlaying(false)} />
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '5px', height: '32px', marginBottom: '12px' }}>
                    <div className="vbar b1" style={{ height: '10px' }}></div>
                    <div className="vbar b2" style={{ height: '18px' }}></div>
                    <div className="vbar b3" style={{ height: '14px' }}></div>
                    <div className="vbar b4" style={{ height: '22px' }}></div>
                    <div className="vbar b5" style={{ height: '9px' }}></div>
                  </div>
                  <input type="range" min="0" max={duration || 0} step="0.1" value={curTime} onChange={onSeek} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: '0.8rem', marginTop: '5px', fontFamily: 'sans-serif' }}>
                    <span>{formatTime(curTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginTop: '15px' }}>
                    <button onClick={() => skip(-10)} style={{ backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '50%', width: '55px', height: '55px', fontSize: '0.85rem', cursor: 'pointer' }}>-10s</button>
                    <button onClick={togglePlay} style={{ backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '50%', width: '75px', height: '75px', fontSize: '1.8rem', cursor: 'pointer', boxShadow: '0 0 25px rgba(255,0,0,0.6)' }}>{playing ? '⏸' : '▶'}</button>
                    <button onClick={() => skip(10)} style={{ backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '50%', width: '55px', height: '55px', fontSize: '0.85rem', cursor: 'pointer' }}>+10s</button>
                  </div>
                  <p style={{ color: '#888', marginTop: '14px', marginBottom: 0, fontSize: '0.85rem' }}>🎧 हेडफ़ोन लगाओ... अकेले मत सुनना</p>
                </div>
              )}

              {readingStory.text && (
                <div className="story-text">{readingStory.text}</div>
              )}
            </div>
          ) : (
            <div style={{ background: 'linear-gradient(145deg, #1a0a0a, #111)', borderRadius: '15px', padding: '30px', border: '2px solid #ff2222', textAlign: 'center', boxShadow: '0 0 40px rgba(255,0,0,0.2)' }}>
              <span style={{ fontSize: '3.5rem' }}>🔒</span>
              <h2 style={{ color: '#ff2222', marginTop: '10px', marginBottom: '5px' }}>यह कहानी Paid है</h2>
              <p style={{ color: '#aaa', fontSize: '1rem' }}>₹{readingStory.price} में Unlock करो।</p>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Paise देने के बाद: Online सुनो + Download करो (offline)।</p>
              <button onClick={() => startPayment(readingStory)}
                style={{ padding: '15px 40px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', boxShadow: '0 0 20px rgba(255,0,0,0.4)' }}>
                🔓 Unlock – ₹{readingStory.price}
              </button>
              <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '12px' }}>सिर्फ personal use के लिए। Commercial use नहीं।</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingBottom: '40px', marginTop: '15px' }}>
            {canPlay && (
              <>
                {readingStory.audio && (
                  <button onClick={() => downloadFile(readingStory)} style={{ flex: 1, minWidth: '140px', padding: '15px', backgroundColor: '#1a2a1a', color: '#4aff4a', border: '1px solid #4aff4a', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>📥 Audio Download</button>
                )}
                {readingStory.text && (
                  <button onClick={() => downloadFile(readingStory)} style={{ flex: 1, minWidth: '140px', padding: '15px', backgroundColor: '#1a2a1a', color: '#4aff4a', border: '1px solid #4aff4a', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>📥 Text Download</button>
                )}
              </>
            )}
            {!canPlay && (
              <button onClick={() => startPayment(readingStory)} style={{ flex: 1, minWidth: '200px', padding: '15px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>🔓 Unlock + Download – ₹{readingStory.price}</button>
            )}
            <button onClick={() => { if (navigator.share) { navigator.share({ title: readingStory.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); alert('Link copy ho gaya! 📋'); } }}
              style={{ flex: 1, minWidth: '100px', padding: '15px', backgroundColor: '#1a1a1a', color: '#aaa', border: '1px solid #444', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>📤 Share</button>
          </div>
        </div>

        {showPayModal && payingStory && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '15px', padding: '30px', maxWidth: '400px', width: '100%', border: '2px solid #ff2222', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem' }}>👻</span>
              <h2 style={{ color: '#ff2222', marginTop: '10px', marginBottom: '5px' }}>Unlock कहानी</h2>
              <p style={{ color: '#ccc', fontSize: '1rem', margin: '5px 0' }}>"{payingStory.title}"</p>
              <p style={{ color: '#ff2222', fontSize: '1.8rem', fontWeight: 'bold', margin: '10px 0' }}>₹{payingStory.price}</p>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>पैसे देने के बाद: Online सुनो + Download करो</p>
              <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '8px' }}>सिर्फ personal use। Commercial use नहीं।</p>
              <button onClick={handlePayment} disabled={paying} style={{ width: '100%', padding: '15px', backgroundColor: paying ? '#555' : '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>{paying ? '⏳ Processing...' : '💳 Pay Now'}</button>
              <button onClick={() => { setShowPayModal(false); setPaying(false); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= HOME PAGE (spooky bg + flicker title) =================
  const pageBlur = showLogin || (isAdmin && (editId !== null || title || text || poster || audio));

  return (
    <div style={{ backgroundColor: '#0d0d0d', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{GLOBAL_CSS}</style>
      <SpookyBG />

      <div style={{ position: 'relative', zIndex: 1, filter: pageBlur ? 'blur(4px) brightness(0.4)' : 'none', transition: 'filter 0.3s', pointerEvents: pageBlur ? 'none' : 'auto' }}>

        <div style={{ padding: '50px 20px 20px', textAlign: 'center' }}>
          <h1 className="spooky-title" style={{ fontSize: '3.2rem', color: '#ff2222', margin: 0, letterSpacing: '4px', fontFamily: 'Georgia, serif' }}>साया</h1>
          <p style={{ color: '#cc8866', marginTop: '8px', fontSize: '1.05rem', letterSpacing: '1px' }}>खौफ़ की हिंदी कहानियाँ</p>
          <p style={{ color: '#776666', marginTop: '4px', fontSize: '0.85rem' }}>डर सिर्फ एक कहानी की दूरी पर है...</p>
          {!isAdmin && (
            <button onClick={() => setShowLogin(true)} style={{ marginTop: '12px', padding: '5px 14px', backgroundColor: 'transparent', color: '#664444', border: '1px solid #3a2222', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>Admin</button>
          )}
          {isAdmin && <p style={{ color: '#00ff00', marginTop: '10px', fontSize: '0.9rem' }}>✅ Admin Mode ON</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '15px 15px 5px', maxWidth: '500px', margin: '0 auto' }}>
          <div onClick={() => setTab('audio')} style={{ flex: 1, textAlign: 'center', padding: '18px 10px', borderRadius: '16px', cursor: 'pointer', background: tab === 'audio' ? 'linear-gradient(145deg, #8B0000, #4d0000)' : 'rgba(22,22,22,0.85)', border: tab === 'audio' ? '2px solid #ff2222' : '2px solid #2a2a2a', boxShadow: tab === 'audio' ? '0 0 20px rgba(255,0,0,0.35)' : 'none', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '2.3rem' }}>🔊</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px', color: tab === 'audio' ? '#fff' : '#888' }}>सुनो</div>
            <div style={{ fontSize: '0.75rem', color: tab === 'audio' ? '#ffbbbb' : '#555', marginTop: '3px' }}>ऑडियो कहानियाँ</div>
          </div>
          <div onClick={() => setTab('text')} style={{ flex: 1, textAlign: 'center', padding: '18px 10px', borderRadius: '16px', cursor: 'pointer', background: tab === 'text' ? 'linear-gradient(145deg, #8B0000, #4d0000)' : 'rgba(22,22,22,0.85)', border: tab === 'text' ? '2px solid #ff2222' : '2px solid #2a2a2a', boxShadow: tab === 'text' ? '0 0 20px rgba(255,0,0,0.35)' : 'none', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '2.3rem' }}>📖</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px', color: tab === 'text' ? '#fff' : '#888' }}>पढ़ो</div>
            <div style={{ fontSize: '0.75rem', color: tab === 'text' ? '#ffbbbb' : '#555', marginTop: '3px' }}>लिखी कहानियाँ</div>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px' }}>

          {isAdmin && (
            <div style={{ backgroundColor: 'rgba(22,22,22,0.92)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: editId ? '2px solid #ffaa00' : '1px solid #ff0000' }}>
              <h2 style={{ color: editId ? '#ffaa00' : '#ff2222', marginTop: 0, fontSize: '1.3rem' }}>{editId ? '✏️ Story Edit कर रहे हो' : '📝 Nayi Story Add Karo'}</h2>
              <input type="text" placeholder="Title (ज़रूरी है)" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>🖼️ Poster (Image file select करो):</label>
                <input type="file" accept="image/*" onChange={onPosterFile} style={{ color: '#888', fontSize: '0.85rem' }} />
                {poster && <p style={{ color: '#4a4', fontSize: '0.8rem', marginTop: '5px' }}>✅ Poster upload हो गई</p>}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>🎵 Audio (MP3 file select करो):</label>
                <input type="file" accept="audio/*" onChange={onAudioFile} style={{ color: '#888', fontSize: '0.85rem' }} />
                {audio && <p style={{ color: '#4a4', fontSize: '0.8rem', marginTop: '5px' }}>✅ Audio upload हो गई</p>}
              </div>
              <textarea placeholder="Story Text (पढ़ने वाली कहानी)" value={text} onChange={(e) => setText(e.target.value)} rows="6" style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#aaa', marginRight: '10px' }}>💰 Price ₹ (0 = Free):</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100px', padding: '10px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px' }} />
              </div>
              {uploading && <p style={{ color: '#ffaa00', textAlign: 'center' }}>⏳ Upload हो रहा है...</p>}
              <button onClick={saveStory} disabled={uploading} style={{ width: '100%', padding: '15px', backgroundColor: editId ? '#ffaa00' : '#ff0000', color: editId ? '#000' : 'white', border: 'none', borderRadius: '8px', fontSize: '1.05rem', cursor: 'pointer', fontWeight: 'bold', opacity: uploading ? 0.5 : 1 }}>
                {uploading ? '⏳ Upload...' : editId ? '✏️ Update करो' : '✅ Publish करो'}
              </button>
              {editId && <button onClick={clearForm} style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>❌ Edit Cancel करो</button>}
            </div>
          )}

          {loading && <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading... 👻</p>}
          {!loading && showList.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>{tab === 'audio' ? '🔊 अभी कोई ऑडियो कहानी नहीं है...' : '📖 अभी कोई लिखी कहानी नहीं है...'}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
            {showList.map((story) => (
              <div key={story.id} onClick={() => openStory(story)} style={{ backgroundColor: 'rgba(22,22,22,0.9)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a2a', cursor: 'pointer', position: 'relative' }}>
                {story.poster ? (
                  <div style={{ position: 'relative' }}>
                    <img src={story.poster} alt={story.title} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '30px 10px 8px' }}>
                      <h3 style={{ color: '#fff', margin: 0, fontSize: '0.95rem', textShadow: '1px 1px 4px #000' }}>{story.title}</h3>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '220px', background: 'linear-gradient(135deg, #1a0000, #330000)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                    <span style={{ fontSize: '3rem' }}>{story.audio ? '🔊' : '👻'}</span>
                    <h3 style={{ color: '#fff', margin: '10px 0 0', fontSize: '0.95rem', textAlign: 'center' }}>{story.title}</h3>
                  </div>
                )}
                {story.price > 0 && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(255,180,0,0.9)', color: '#000', borderRadius: '20px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>🔒 ₹{story.price}</span>}
                {story.price === 0 && <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,255,100,0.8)', color: '#000', borderRadius: '20px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>FREE</span>}
                {isAdmin && (
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); startEdit(story); }} style={{ backgroundColor: 'rgba(255,170,0,0.9)', color: '#000', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '0.9rem' }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); removeStory(story.id); }} style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff4444', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: '#443333', padding: '30px 0', fontSize: '0.8rem' }}>© साया - खौफ़ की हिंदी कहानियाँ</p>
        </div>
      </div>

      {showLogin && !isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #ff2222', width: '100%', maxWidth: '350px', boxShadow: '0 0 40px rgba(255,0,0,0.3)' }}>
            <h2 style={{ color: '#ff2222', textAlign: 'center', marginTop: 0, marginBottom: '15px' }}>🔐 Admin Login</h2>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            <button onClick={handleLogin} style={{ width: '100%', padding: '14px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Login</button>
            <button onClick={() => { setShowLogin(false); setPassword(''); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
