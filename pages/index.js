import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

const ADMIN_PASSWORD = "bhoot123";

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
  const [readingStory, setReadingStory] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => { loadStories(); }, []);

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

  const addStory = async () => {
    if (!title || !text) return alert('Title aur Story dono likho!');
    try {
      await addDoc(collection(db, "stories"), {
        title, text,
        poster: poster || '',
        audio: audio || '',
        price: parseInt(price) || 0,
        createdAt: Date.now(),
        date: new Date().toLocaleDateString('hi-IN')
      });
      setTitle(''); setText(''); setPoster(''); setAudio(''); setPrice('0');
      alert('Story publish ho gayi! 👻');
      loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const removeStory = async (id) => {
    if (!confirm('Pakka delete karna hai?')) return;
    await deleteDoc(doc(db, "stories", id));
    loadStories();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const skip = (sec) => {
    if (audioRef.current) audioRef.current.currentTime += sec;
  };

  const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' };

  // ================= STORY READING PAGE =================
  if (readingStory) {
    return (
      <div style={{ backgroundColor: '#0d0d0d', color: '#fff', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '15px' }}>
          <button onClick={() => { setReadingStory(null); setPlaying(false); }} style={{ padding: '10px 20px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', marginBottom: '15px' }}>← Wapas</button>

          {/* Poster with Title on it */}
          {readingStory.poster && (
            <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', marginBottom: '15px' }}>
              <img src={readingStory.poster} alt={readingStory.title} style={{ width: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '40px 20px 15px' }}>
                <h1 style={{ color: '#ff2222', margin: 0, fontSize: '1.8rem', textShadow: '2px 2px 8px #000' }}>{readingStory.title}</h1>
              </div>
            </div>
          )}
          {!readingStory.poster && <h1 style={{ color: '#ff2222' }}>{readingStory.title}</h1>}

          {/* Audio Player */}
          {readingStory.audio && (
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #333', textAlign: 'center' }}>
              <audio ref={audioRef} src={readingStory.audio} onEnded={() => setPlaying(false)} />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px' }}>
                <button onClick={() => skip(-10)} style={{ backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '50%', width: '55px', height: '55px', fontSize: '0.85rem', cursor: 'pointer' }}>-10s</button>
                <button onClick={togglePlay} style={{ backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '50%', width: '75px', height: '75px', fontSize: '1.8rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,0,0.5)' }}>{playing ? '⏸' : '▶'}</button>
                <button onClick={() => skip(10)} style={{ backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '50%', width: '55px', height: '55px', fontSize: '0.85rem', cursor: 'pointer' }}>+10s</button>
              </div>
              <p style={{ color: '#888', marginTop: '12px', marginBottom: 0, fontSize: '0.85rem' }}>🎧 Headphones lagao, akele mat suno...</p>
            </div>
          )}

          {/* Story Text */}
          <div style={{ color: '#ddd', lineHeight: '2', fontSize: '1.15rem', whiteSpace: 'pre-wrap', paddingBottom: '50px' }}>{readingStory.text}</div>
        </div>
      </div>
    );
  }

  // ================= HOME PAGE =================
  return (
    <div style={{ backgroundColor: '#0d0d0d', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #1a0000, #0d0d0d)', padding: '35px 20px 25px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#ff2222', margin: 0, textShadow: '0 0 20px rgba(255,0,0,0.4)' }}>👻 Bhoot Ki Kahaniyan</h1>
        <p style={{ color: '#999', marginTop: '8px', fontSize: '0.95rem' }}>Darr sirf ek kahani ki doori par hai...</p>
        {!isAdmin && <button onClick={() => setShowLogin(!showLogin)} style={{ marginTop: '10px', padding: '5px 14px', backgroundColor: 'transparent', color: '#444', border: '1px solid #2a2a2a', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>Admin</button>}
        {isAdmin && <p style={{ color: '#00ff00', marginTop: '10px', fontSize: '0.9rem' }}>✅ Admin Mode ON</p>}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px' }}>

        {/* Admin Login */}
        {showLogin && !isAdmin && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #333' }}>
            <input type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
            <button onClick={handleLogin} style={{ width: '100%', padding: '12px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>Login</button>
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <div style={{ backgroundColor: '#161616', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #ff0000' }}>
            <h2 style={{ color: '#ff2222', marginTop: 0, fontSize: '1.3rem' }}>📝 Nayi Story Add Karo</h2>
            <input type="text" placeholder="Story ka Title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Poster ka Link (postimages.org se) - Optional" value={poster} onChange={(e) => setPoster(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Audio ka Link (catbox.moe se) - Optional" value={audio} onChange={(e) => setAudio(e.target.value)} style={inputStyle} />
            <textarea placeholder="Puri story yahan likho..." value={text} onChange={(e) => setText(e.target.value)} rows="8" style={{ ...inputStyle, resize: 'vertical' }} />
            <button onClick={addStory} style={{ width: '100%', padding: '15px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.05rem', cursor: 'pointer', fontWeight: 'bold' }}>✅ Story Publish Karo</button>
          </div>
        )}

        {/* Stories Grid */}
        {loading && <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading... 👻</p>}
        {!loading && stories.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Abhi koi kahani nahi hai...</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {stories.map((story) => (
            <div key={story.id} onClick={() => setReadingStory(story)} style={{ backgroundColor: '#161616', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a2a', cursor: 'pointer', position: 'relative' }}>
              
              {/* Poster */}
              {story.poster ? (
                <div style={{ position: 'relative' }}>
                  <img src={story.poster} alt={story.title} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '30px 10px 8px' }}>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '0.95rem', textShadow: '1px 1px 4px #000' }}>{story.title}</h3>
                  </div>
                  {story.audio && <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(255,0,0,0.85)', borderRadius: '20px', padding: '3px 8px', fontSize: '0.7rem' }}>🎧 Audio</span>}
                </div>
              ) : (
                <div style={{ height: '220px', background: 'linear-gradient(135deg, #1a0000, #330000)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                  <span style={{ fontSize: '3rem' }}>👻</span>
                  <h3 style={{ color: '#fff', margin: '10px 0 0', fontSize: '0.95rem', textAlign: 'center' }}>{story.title}</h3>
                </div>
              )}

              {/* Delete for admin */}
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); removeStory(story.id); }} style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>🗑️</button>
              )}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#333', padding: '30px 0', fontSize: '0.8rem' }}>© Bhoot Ki Kahaniyan</p>
      </div>
    </div>
  );
}
