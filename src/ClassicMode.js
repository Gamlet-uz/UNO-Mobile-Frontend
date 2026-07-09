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
    
    // 1. Bo'sh xona qidirish yoki yangisini yaratish
    const findOrCreateRoom = async () => {
      const roomsRef = ref(db, 'rooms');
      const snapshot = await get(roomsRef);
      let foundRoomId = null;

      if (snapshot.exists()) {
        const rooms = snapshot.val();
        for (const [id, room] of Object.entries(rooms)) {
          if (room.status === 'waiting' && Object.keys(room.players || {}).length < 4) {
            foundRoomId = id;
            break;
          }
        }
      }

      if (!foundRoomId) {
        foundRoomId = 'room_' + Math.floor(Math.random() * 100000);
        await set(ref(db, `rooms/${foundRoomId}`), {
          status: 'waiting',
          players: {
            [tgUser.id]: { name: tgUser.first_name, cards: [] }
          }
        });
      } else {
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
    // 2. Xonadagi o'zgarishlarni jonli kuzatish
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        if (data.status === 'playing') {
          setIsMatching(false);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Karta rangini CSS klassiga o'tkazish uchun yordamchi funksiya
  const getCardClass = (color) => {
    switch (color) {
      case 'red': return 'card-red';
      case 'yellow': return 'card-yellow';
      case 'green': return 'card-green';
      case 'blue': return 'card-blue';
      case 'black': return 'card-black';
      default: return '';
    }
  };

  // Karta yozuvini (ikonkasini) chiroyli chiqarish uchun
  const getCardDisplayValue = (value) => {
    if (value === 'wild') return 'W';
    if (value === 'wild4') return '+4';
    if (value === 'skip') return '⊘';
    if (value === 'reverse') return '⇄';
    if (value === 'draw2') return '+2';
    return value;
  };

  // --- 1. KUTISH EKRANI ---
  if (isMatching) {
    const playersCount = roomData && roomData.players ? Object.keys(roomData.players).length : 1;
    
    return (
      <div className="classic-container">
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <b onClick={onBack} style={{ cursor: 'pointer', fontSize: '20px' }}>⬅ CLASSIC</b>
          <b>{playersCount}/4</b>
        </div>
        
        <div className="matchmaking-screen">
          <div className="players-slots">
            <div className="slot filled">
              <div className="slot-avatar">UNO</div>
              <b>{tgUser?.first_name}</b>
            </div>
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

  // --- 2. ASOSIY O'YIN EKRANI ---
  const myCards = roomData?.players?.[tgUser?.id]?.cards || [];
  const centerCard = roomData?.current_card;
  const currentTurn = roomData?.current_turn;
  const isMyTurn = currentTurn == tgUser?.id;

  return (
    <div className="classic-container">
      <div className="game-screen">
        <div className="globe-table"></div>
        <div className="uno-center-text">UNO</div>

        {/* Raqiblar (Hozircha vizual, keyinchalik aniq o'yinchilarga bog'laymiz) */}
        <div className="player-pos player-top">
          <div className="mini-avatar"></div>
          <div className="hand opponent-hand-top">
             {[...Array(7)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>
        <div className="player-pos player-left">
          <div className="mini-avatar"></div>
          <div style={{display:'flex', flexDirection:'column'}} className="hand opponent-hand-left">
             {[...Array(7)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>
        <div className="player-pos player-right">
          <div className="mini-avatar"></div>
          <div style={{display:'flex', flexDirection:'column'}} className="hand opponent-hand-right">
             {[...Array(7)].map((_,i) => <div key={i} className="uno-card-back"></div>)}
          </div>
        </div>

        {/* Markazdagi tashlangan karta */}
        {centerCard && (
          <div className="center-pile">
            <div className={`uno-card ${getCardClass(centerCard.color)}`}>
              {/* Oq ellipsni to'g'ri ishlashi uchun span qo'shildi */}
              <span className="uno-card-value">{getCardDisplayValue(centerCard.value)}</span>
            </div>
          </div>
        )}

        {/* O'zimizning HAQIQIY kartalarimiz (Yelpig'ich dizaynida) */}
        <div className="my-hand">
          {myCards.map((card, index) => {
            // Yelpig'ich effektini hisoblash
            const totalCards = myCards.length;
            const midPoint = (totalCards - 1) / 2;
            const offset = index - midPoint; 
            const angle = offset * 6; // Har bir karta 6 gradusga buriladi
            const yTranslate = Math.abs(offset) * 3; // Chetkalar biroz pastga tushadi
            
            const turnBoost = isMyTurn ? -15 : 0; // Navbat kelganda hamma karta biroz tepaga chiqadi

            return (
              <div 
                key={index} 
                className={`uno-card ${getCardClass(card.color)}`}
                style={{
                  transform: `rotate(${angle}deg) translateY(${turnBoost + yTranslate}px)`, 
                  zIndex: index, // O'ngdagi karta doim chapdagining ustiga chiqadi
                  boxShadow: isMyTurn ? '0 0 10px rgba(255,255,255,0.3)' : '-3px 5px 10px rgba(0,0,0,0.5)'
                }}
              >
                {/* Oq ellipsni to'g'ri ishlashi uchun span qo'shildi */}
                <span className="uno-card-value">{getCardDisplayValue(card.value)}</span>
              </div>
            );
          })}
        </div>

        {/* Navbat ko'rsatkichi */}
        {isMyTurn && (
          <div style={{ position: 'absolute', bottom: '130px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '15px' }}>
            Sizning navbatingiz!
          </div>
        )}

        <div className="call-uno-btn">CALL<br/>UNO</div>
      </div>
    </div>
  );
}

export default ClassicMode;
