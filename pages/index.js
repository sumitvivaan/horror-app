import { useState, useEffect } from 'react';
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
  const [price, setPrice] = useState('50');
  const [readingStory, setReadingStory] = useState(null);

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
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true); setShowLogin(false); setPassword('');
    } else { alert('Galat password!'); }
  };

  const addStory = async () => {
    if (!title || !text) return alert('Title aur Story dono likho!');
    try {
      await addDoc(collection(db, "stories"), {
        title, text, price: parseInt(price) || 0,
        createdAt: Date.now(),
        date: new Date().toLocaleDateString('hi-IN')
      });
      setTitle(''); setText(''); setPrice('50');
      alert('Story publish ho gayi! 👻');
      loadStories();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const removeStory = async (id) => {
    if (!confirm('Pakka delete karna hai?')) return;
    await deleteDoc(doc(db, "stories", id));
    loadStories();
  };

  if (readingStory) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
          <button onClick={() => setReadingStory(null)} style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>← Wapas Jao</button>
          <h1 style={{ color: '#ff0000' }}>{readingStory.title}</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>📅 {readingStory.date}</p>
          <div style={{ color: '#ddd', lineHeight: '1.9', fontSize: '1.15rem', whiteSpace: 'pre-wrap', marginTop: '20px' }}>{readingStory.text}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      <div style={{ background: 'linear-gradient(135deg, #1a0000, #330000)', padding: '30px 20px', textAlign: 'center', borderBottom: '2px solid #ff0000' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#ff0000', margin: 0 }}>👻 Bhoot Ki Kahaniyan 👻</h1>
        <p style={{ color: '#aaa', marginTop: '8px' }}>Darr sirf ek kahani ki doori par hai...</p>
        {!isAdmin && (
          <button onClick={() => setShowLogin(!showLogin)} style={{ marginTop: '10px', padding: '6px 15px', backgroundColor: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Admin</button>
        )}
        {isAdmin && <p style={{ color: '#00ff00', marginTop: '10px' }}>✅ Admin Mode ON</p>}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

        {showLogin && !isAdmin && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
            <input type="password" placeholder="Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '5px', marginRight: '10px' }} />
            <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Login</button>
          </div>
        )}

        {isAdmin && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #ff0000' }}>
            <h2 style={{ color: '#ff0000', marginTop: 0 }}>📝 Nayi Story Add Karo</h2>
            <input type="text" placeholder="Story ka Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '5px', boxSizing: 'border-box' }} />
            <textarea placeholder="Puri story yahan likho..." value={text} onChange={(e) => setText(e.target.value)} rows="10" style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '5px', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#aaa', marginRight: '10px' }}>Price (₹) [0 = Free]:</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100px', padding: '10px', backgroundColor: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '5px' }} />
            </div>
            <button onClick={addStory} style={{ width: '100%', padding: '15px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}>✅ Story Publish Karo</button>
          </div>
        )}

        <h2 style={{ color: '#ff0000', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📚 Latest Kahaniyan</h2>

        {loading && <p style={{ color: '#888', textAlign: 'center' }}>Loading... 👻</p>}

        {!loading && stories.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Abhi koi kahani nahi hai. Jald aa rahi hai...</p>
        )}

        {stories.map((story) => (
          <div key={story.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' }}>
            <h3 style={{ color: '#ff4444', marginTop: 0 }}>{story.title}</h3>
            <p style={{ color: '#bbb', lineHeight: '1.6' }}>{story.text.substring(0, 150)}...</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: '#777', fontSize: '0.85rem' }}>📅 {story.date}</span>
              <div>
                <button onClick={() => setReadingStory(story)} style={{ padding: '10px 25px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📖 Padho</button>
                {isAdmin && (
                  <button onClick={() => removeStory(story.id)} style={{ padding: '10px 15px', backgroundColor: '#440000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}>🗑️</button>
                )}
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
