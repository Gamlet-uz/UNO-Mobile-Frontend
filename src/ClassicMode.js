import React, { useState, useEffect } from 'react';
import './ClassicMode.css';
import { db } from './firebase';
import { ref, get, set, update, onValue } from 'firebase/database';

function ClassicMode({ tgUser, onBack }) {
  const [roomData, setRoomData] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isMatching, setIsMatching] = useState(true);

  useEffect(() => {
    if (!tgUser) return;
    
    // 1. Firebase'dan bo'sh xona qidirish yoki yangisini yaratish
    const findOrCreateRoom = async () => {
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      let foundRoomId = null;

      if (snapshot.exists()) {
        const rooms = snapshot.val();
        for (const [id, room] of Object.entries(rooms)) {
          // Agar xona kutish rejimida bo'lsa va 4 kishidan kam bo'lsa
          if (room.status === 'waiting' && Object.keys(room.players || {}).length < 4) {
            foundRoomId = id;
            break;
          }
        }
      }

      if (!foundRoomId) {
        // Yangi xona yaratish
        foundRoomId = 'room_' + Math.floor(Math.random() * 100000);
        await set(ref(db, `rooms/${foundRoomId}`), {
          status: 'waiting',
          players: {
            [tgUser.id]: { name: tgUser.first_name, cards: [] }
          }
        });
      } else {
        // Mavjud xonaga qo'shilish
        await update(ref(db, `rooms/${foundRoomId}/players/${tgUser.id}`), {
          name: tgUser.first_name,
          cards: []
        });
      }

      setRoomId(foundRoomId);
    };

    findOrCreateRoom();
  }, [tgUser]);

  useEffect(() => {
    // 2. Xonadagi o'zgarishlarni jonli kuzatish (Real-time listener)
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        
        const playerCount = Object.keys(data.players || {}).length;
        
        // Agar 4 kishi yig'ilsa, o'yinni boshlash (statusni o'zgartirish)
        if (playerCount === 4 && data.status === 'waiting') {
          update(ref(db, `rooms/${roomId}`), { status: 'playing' });
        }
        
        if (data.status === 'playing') {
          setIsMatching(false);
        }
      }
    });

    return () => unsubscribe(); // Komponent yopilganda ulanishni uzish
  }, [roomId]);

  // --- 1. KUTISH EKRANI (Matchmaking) ---
  if (isMatching) {
    const playersCount = roomData ? Object.keys(roomData.players).length : 1;
    
    return (
      <div className="classic-container">
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <b onClick={onBack} style={{ cursor: 'pointer', fontSize: '20px' }}>⬅ CLASSIC</b>
          <b>{playersCount}/4</b>
        </div>
        
        <div className="matchmaking-screen">
          <div className="players-slots">
            {/* O'zimiz */}
            <div className="slot filled">
              <div className="slot-avatar">UNO</div>
              <b>{tgUser?.first_name}</b>
            </div>
            {/* Raqiblar (Bo'sh joylar) */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="slot">
                {i < (playersCount - 1) ? (
                  <>
                    <div className="slot-avatar" style={{background: '#ff5555'}}>Raqib</div>
                    <b>Ready</b>
                  </>
                ) : (
                  'Matching..'
                )}
              </div>
            ))}
          </div>
          <div className="tips-box">Tips: Har bir raund 3 daqiqa davom etadi.</div>
        </div>
      </div>
    );
  }

  // --- 2. ASOSIY O'YIN EKRANI (Globe) ---
  return (
    <div className="classic-container">
      <div className="game-screen">
        {/* Yer shari */}
        <div className="globe-table"></div>
        <div className="uno-center-text">UNO</div>

        {/* Tepadagi raqib */}
        <div className="player-pos player-top">
          <div className="mini-avatar"></div>
          <div className="hand opponent-hand-top">
             {[...Array(5)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>

        {/* Chapdagi raqib */}
        <div className="player-pos player-left">
          <div className="mini-avatar"></div>
          <div style={{display:'flex', flexDirection:'column'}} className="hand opponent-hand-left">
             {[...Array(5)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>

        {/* O'ngdagi raqib */}
        <div className="player-pos player-right">
          <div className="mini-avatar"></div>
          <div style={{display:'flex', flexDirection:'column'}} className="hand opponent-hand-right">
             {[...Array(5)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>

        {/* Markazdagi tashlangan karta (Namuna) */}
        <div className="center-pile">
          <div className="uno-card card-yellow">9</div>
        </div>

        {/* O'zimizning kartalarimiz (Namuna) */}
        <div className="my-hand">
          <div className="uno-card card-black">+4</div>
          <div className="uno-card card-yellow">2</div>
          <div className="uno-card card-green">8</div>
          <div className="uno-card card-blue">8</div>
        </div>

        {/* CALL UNO Tugmasi */}
        <div className="call-uno-btn">CALL<br/>UNO</div>
      </div>
    </div>
  );
}

export default ClassicMode;
