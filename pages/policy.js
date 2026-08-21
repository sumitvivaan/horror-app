import { useState } from 'react';
import Head from 'next/head';

const CONTACT_EMAIL = "vivaan2024koshiya@gmail.com";
const CONTACT_PHONE = "+91-9654055269";
const SITE_NAME = "साया (Saaya)";
const SITE_URL = "https://horror-app-liard.vercel.app";

export default function Policy() {
  const [tab, setTab] = useState('about');

  const tabs = [
    { id: 'about', label: '📖 About Us' },
    { id: 'contact', label: '📞 Contact Us' },
    { id: 'privacy', label: '🔒 Privacy Policy' },
    { id: 'terms', label: '📜 Terms & Conditions' },
    { id: 'refund', label: '💰 Refund Policy' },
  ];

  const h = { color: '#ff8822', fontFamily: 'Georgia, serif' };
  const p = { color: '#ccc', lineHeight: '1.9', fontSize: '0.95rem' };

  return (
    <div style={{ backgroundColor: '#0a0a10', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head><title>Policies - साया | Saaya Horror Stories</title></Head>

      <div style={{ background: 'linear-gradient(180deg, rgba(10,10,16,0.98), rgba(10,10,16,0.85))', padding: '14px 18px', borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#ff6600', margin: 0, letterSpacing: '3px', fontFamily: 'Georgia, serif' }}>साया 👻</h1>
        <a href="/" style={{ color: '#ffaa55', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid #2a2a35', padding: '7px 16px', borderRadius: '18px' }}>← Home</a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 15px 50px' }}>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '9px 16px', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', backgroundColor: tab === t.id ? '#ff6600' : '#14141a', color: tab === t.id ? '#fff' : '#888', border: tab === t.id ? 'none' : '1px solid #2a2a35' }}>{t.label}</button>
          ))}
        </div>

        <div style={{ backgroundColor: '#14141a', borderRadius: '14px', padding: '25px', border: '1px solid #2a2a35' }}>

          {tab === 'about' && (
            <div>
              <h2 style={h}>📖 About Us</h2>
              <p style={p}>Welcome to <b>{SITE_NAME}</b> — a digital entertainment platform dedicated to horror stories in Hindi and English.</p>
              <p style={p}>We offer:</p>
              <ul style={p}>
                <li>🔊 <b>Audio Horror Stories</b> — professionally narrated scary stories you can listen to online or download for offline listening.</li>
                <li>📖 <b>Written Horror Stories</b> — spine-chilling stories you can read on any device.</li>
                <li>🆓 <b>Free & Premium Content</b> — many stories are completely free. Premium stories can be unlocked with a small one-time payment (₹19 – ₹99 per story).</li>
              </ul>
              <p style={p}>All content on this platform is 100% digital. There are no physical products and no shipping involved. Once a premium story is purchased, it unlocks instantly on the user's device.</p>
              <p style={p}>Our mission: <i>"डर सिर्फ एक कहानी की दूरी पर है..."</i> (Fear is just one story away.)</p>
            </div>
          )}

          {tab === 'contact' && (
            <div>
              <h2 style={h}>📞 Contact Us</h2>
              <p style={p}>Have a question, complaint, payment issue, or feedback? We are happy to help!</p>
              <div style={{ backgroundColor: '#0a0a10', borderRadius: '10px', padding: '20px', border: '1px solid #2a2a35', marginTop: '15px' }}>
                <p style={{ ...p, margin: '8px 0' }}>📧 <b>Email:</b> <a href={'mailto:' + CONTACT_EMAIL} style={{ color: '#ffaa55' }}>{CONTACT_EMAIL}</a></p>
                <p style={{ ...p, margin: '8px 0' }}>📱 <b>Phone/WhatsApp:</b> {CONTACT_PHONE}</p>
                <p style={{ ...p, margin: '8px 0' }}>🌐 <b>Website:</b> {SITE_URL}</p>
                <p style={{ ...p, margin: '8px 0' }}>⏰ <b>Support Hours:</b> Monday – Saturday, 10:00 AM – 7:00 PM IST</p>
              </div>
              <p style={{ ...p, marginTop: '15px' }}>We aim to respond to all queries within <b>24–48 hours</b>. For payment-related issues, please include your payment ID and registered contact details.</p>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <h2 style={h}>🔒 Privacy Policy</h2>
              <p style={p}><b>Last Updated:</b> {new Date().toLocaleDateString('en-IN')}</p>
              <p style={p}>At {SITE_NAME}, we respect your privacy. This policy explains what information we collect and how we use it.</p>
              <h3 style={h}>1. Information We Collect</h3>
              <ul style={p}>
                <li><b>Usage Data:</b> Story views and ratings (stored anonymously).</li>
                <li><b>Payment Data:</b> Payments are processed securely by <b>Razorpay</b>. We do NOT store your card numbers, UPI IDs, or bank details on our servers. Razorpay may collect your phone number/email for payment receipts as per their own privacy policy.</li>
                <li><b>Local Storage:</b> Your unlocked stories and preferences (like theme choice) are saved in your own browser's local storage on your device.</li>
              </ul>
              <h3 style={h}>2. How We Use Information</h3>
              <ul style={p}>
                <li>To unlock and deliver purchased premium content instantly.</li>
                <li>To improve our stories and app experience.</li>
                <li>To respond to support queries.</li>
              </ul>
              <h3 style={h}>3. Data Sharing</h3>
              <p style={p}>We do NOT sell, rent, or trade your personal information to any third party. Data is only shared with our payment processor (Razorpay) to complete transactions.</p>
              <h3 style={h}>4. Third-Party Services</h3>
              <p style={p}>We use Google Firebase (data storage), Cloudinary (media hosting), Vercel (website hosting), and Razorpay (payments). Each service has its own privacy policy.</p>
              <h3 style={h}>5. Children's Privacy</h3>
              <p style={p}>Our content is horror-themed and recommended for users aged 13 and above.</p>
              <h3 style={h}>6. Contact</h3>
              <p style={p}>For any privacy concerns, email us at <a href={'mailto:' + CONTACT_EMAIL} style={{ color: '#ffaa55' }}>{CONTACT_EMAIL}</a></p>
            </div>
          )}

          {tab === 'terms' && (
            <div>
              <h2 style={h}>📜 Terms & Conditions</h2>
              <p style={p}><b>Last Updated:</b> {new Date().toLocaleDateString('en-IN')}</p>
              <p style={p}>By using {SITE_NAME} ({SITE_URL}), you agree to the following terms:</p>
              <h3 style={h}>1. Services</h3>
              <p style={p}>We provide digital horror story content (audio and text) in Hindi and English. Free content is accessible to everyone. Premium content requires a one-time payment per story (₹19 – ₹99).</p>
              <h3 style={h}>2. Payments & Delivery</h3>
              <ul style={p}>
                <li>All payments are processed securely via Razorpay.</li>
                <li>Delivery is <b>instant</b> — premium content unlocks immediately after successful payment on the same device/browser.</li>
                <li>Prices are listed in Indian Rupees (INR) and may change at any time.</li>
              </ul>
              <h3 style={h}>3. Content Usage</h3>
              <ul style={p}>
                <li>Purchased content is for <b>personal use only</b>.</li>
                <li>You may download audio for personal offline listening.</li>
                <li>Re-selling, re-uploading, or commercial use of our content without written permission is strictly prohibited.</li>
              </ul>
              <h3 style={h}>4. Intellectual Property</h3>
              <p style={p}>All stories, audio recordings, posters, and branding on this platform are the property of {SITE_NAME} and are protected by copyright.</p>
              <h3 style={h}>5. Content Disclaimer</h3>
              <p style={p}>All stories are works of fiction created for entertainment. Horror content may not be suitable for very young or sensitive audiences. Listener/reader discretion is advised.</p>
              <h3 style={h}>6. Limitation of Liability</h3>
              <p style={p}>We strive for 100% uptime but are not liable for temporary technical outages of hosting/payment providers.</p>
              <h3 style={h}>7. Governing Law</h3>
              <p style={p}>These terms are governed by the laws of India.</p>
            </div>
          )}

          {tab === 'refund' && (
            <div>
              <h2 style={h}>💰 Refund & Cancellation Policy</h2>
              <p style={p}><b>Last Updated:</b> {new Date().toLocaleDateString('en-IN')}</p>
              <h3 style={h}>1. Nature of Product</h3>
              <p style={p}>All products sold on {SITE_NAME} are <b>digital goods</b> (audio/text stories) with <b>instant delivery</b>. Once a story is unlocked, it cannot be "returned."</p>
              <h3 style={h}>2. Refund Eligibility</h3>
              <p style={p}>We offer refunds in the following cases:</p>
              <ul style={p}>
                <li>❌ <b>Payment deducted but story did NOT unlock</b> — full refund or manual unlock within 48 hours.</li>
                <li>❌ <b>Duplicate payment</b> for the same story — duplicate amount fully refunded.</li>
                <li>❌ <b>Technical fault</b> where the purchased audio/text is broken or inaccessible and we cannot fix it within 48 hours — full refund.</li>
              </ul>
              <h3 style={h}>3. Non-Refundable Cases</h3>
              <ul style={p}>
                <li>Change of mind after successfully unlocking and accessing the story.</li>
                <li>Not liking the story content (stories have free previews/details before purchase).</li>
              </ul>
              <h3 style={h}>4. How to Request a Refund</h3>
              <p style={p}>Email us at <a href={'mailto:' + CONTACT_EMAIL} style={{ color: '#ffaa55' }}>{CONTACT_EMAIL}</a> within <b>7 days</b> of payment with:</p>
              <ul style={p}>
                <li>Razorpay Payment ID</li>
                <li>Story name</li>
                <li>Issue description (screenshot if possible)</li>
              </ul>
              <h3 style={h}>5. Refund Timeline</h3>
              <p style={p}>Approved refunds are processed within <b>5–7 business days</b> to the original payment method via Razorpay.</p>
            </div>
          )}

        </div>

        <p style={{ textAlign: 'center', color: '#3a2a1a', padding: '25px 0 0', fontSize: '0.8rem' }}>© {SITE_NAME} - खौफ़ की हिंदी कहानियाँ 🎃</p>
      </div>
    </div>
  );
}
