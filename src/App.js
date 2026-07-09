import React, { useEffect, useState } from 'react';
import './App.css'; // Yangi yozgan dizaynimizni ulash
import { db } from './firebase';

function App() {
  const [tgUser, setTgUser] = useState(null);
  const [activeView, setActiveView] = useState('lobby'); // 'lobby', 'classic', 'wild', 'friends'

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1b5e20');
      tg.setBackgroundColor('#1b5e20');
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  // Rejim tanlanganda ishlaydigan funksiya
  const handleModeSelect = (mode) => {
    // Hozircha bosilganda sahifa o'zgaradi. Keyinchalik shu yerga Firebase'dan xona ochish kodini yozamiz.
    setActiveView(mode);
  };

  // Asosiy menyu (3 ta kartochka)
  const renderLobby = () => (
    <div className="modes-container">
      {/* 1. Classic Mode */}
      <div className="mode-card classic-mode" onClick={() => handleModeSelect('classic')}>
        <div className="card-content">
          <h2>Classic Mode</h2>
          <p>An'anaviy qoidalar</p>
        </div>
        <div className="card-icon">🃏</div>
      </div>

      {/* 2. Go Wild */}
      <div className="mode-card wild-mode" onClick={() => handleModeSelect('wild')}>
        <div className="card-content">
          <h2>Go Wild</h2>
          <p>Ko'proq Maxsus Kartalar</p>
        </div>
        <div className="card-icon">🌀</div>
      </div>

      {/* 3. Play with Friends */}
      <div className="mode-card friends-mode" onClick={() => handleModeSelect('friends')}>
        <div className="card-content">
          <h2>Play with Friends</h2>
          <p>Do'stlar bilan xususiy xona</p>
        </div>
        <div className="card-icon">👥</div>
      </div>
    </div>
  );

  // Tanlangan o'yin stoli (Keyingi bosqichda shu yerni to'ldiramiz)
  const renderGameRoom = () => (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>{activeView.toUpperCase()} MODE</h2>
      <p>O'yin stoli yuklanmoqda...</p>
      <button 
        style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#fff', color: '#333', marginTop: '20px', fontWeight: 'bold' }}
        onClick={() => setActiveView('lobby')}
      >
        Orqaga qaytish
      </button>
    </div>
  );

  return (
    <div className="uno-container">
      {/* Har doim tepada turadigan qism */}
      <div className="header-section">
        <h1 className="uno-logo">UNO</h1>
        <div className="user-badge">
          {tgUser ? `👤 ${tgUser.first_name}` : '👤 Mehmon'}
        </div>
      </div>

      {/* Holatga qarab yo Menyu yoki O'yin stolini ko'rsatamiz */}
      {activeView === 'lobby' ? renderLobby() : renderGameRoom()}
      
    </div>
  );
}

export default App;
