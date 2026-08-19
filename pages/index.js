export default function Home() {
  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#ff0000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>👻 Bhoot Ki Kahaniyan 👻</h1>
      <p style={{ fontSize: '1.2rem', color: '#cccccc', maxWidth: '600px' }}>
        Aapka Horror Story App successfully internet par live ho gaya hai! 
        <br/>
        Ab hum isme Firebase, Audio Player, aur Razorpay add karenge.
      </p>
      <button style={{ marginTop: '30px', padding: '15px 30px', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer' }}>
        Pehli Story Suno (Jaldi aa rahi hai)
      </button>
    </div>
  )
}
