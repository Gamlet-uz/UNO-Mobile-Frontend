import React, { useEffect, useState } from 'react';
import { db } from './firebase'; // Bazaga tayyor ulanish
import { ref, onValue } from 'firebase/database'; // Keyinchalik kartalarni o'qish uchun

function App() {
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    // Ilova Telegram ichida ochilganini tekshiramiz
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand(); // Ilovani to'liq ekranga yoyish
      
      // Bot qora/oq temada bo'lsa, fonni to'g'irlash
      tg.setHeaderColor('#1a472a');
      tg.setBackgroundColor('#1a472a');

      // Foydalanuvchi ma'lumotlarini saqlash
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1 style={{ color: '#ffcc00', textShadow: '2px 2px 4px #000' }}>UNO</h1>
      
      {tgUser ? (
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '15px', width: '90%' }}>
          <p style={{ margin: 0, fontSize: '18px' }}>O'yinchi: <b>{tgUser.first_name}</b></p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#ccc' }}>ID: {tgUser.id}</p>
        </div>
      ) : (
        <p style={{ color: '#ffaaaa' }}>Iltimos, ilovani Telegram bot orqali oching.</p>
      )}

      <div style={{ 
        marginTop: '30px', 
        width: '100%', 
        height: '300px', 
        border: '3px dashed rgba(255, 255, 255, 0.3)', 
        borderRadius: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        <h2 style={{ color: 'rgba(255, 255, 255, 0.5)' }}>O'yin Stoli</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', textAlign: 'center', padding: '0 20px' }}>
          Yaqinda bu yerda kartalar va raqiblar paydo bo'ladi.
        </p>
      </div>
    </div>
  );
}

export default App;
