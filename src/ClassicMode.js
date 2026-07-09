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
          players: { [tgUser.id]: { name: tgUser.first_name, cards: [] } }
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
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        if (data.status === 'playing') setIsMatching(false);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

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

  const getCardDisplayValue = (value) => {
    if (value === 'wild') return 'W';
    if (value === 'wild4') return '+4';
    if (value === 'skip') return '⊘';
    if (value === 'reverse') return '⇄';
    if (value === 'draw2') return '+2';
    return value;
  };

  // ==========================================
  // O'YIN MANTIQI (Navbat, Tashlash, Olish)
  // ==========================================
  
  const currentTurn = roomData?.current_turn;
  const isMyTurn = currentTurn == tgUser?.id;

  // 1. Karta tashlash
  const handlePlayCard = async (card, index) => {
    if (!isMyTurn) return; // Navbat bizniki bo'lmasa ishlamaydi

    const centerCard = roomData.current_card;
    
    // Qoida tekshiruvi: Rangi bir xil, Raqami bir xil yoki Qora karta bo'lishi kerak
    const isValid = card.color === 'black' || card.color === centerCard.color || card.value === centerCard.value;
    
    if (!isValid) {
      // (Kelajakda bu yerga qizil rangda titrash effektini qo'shamiz)
      return; 
    }

    // Qo'limizdan kartani olib tashlaymiz
    const myCards = [...roomData.players[tgUser.id].cards];
    myCards.splice(index, 1);

    // Navbatni hisoblash
    const playerIds = Object.keys(roomData.players);
    const currentIndex = playerIds.indexOf(tgUser.id);
    let direction = roomData.direction || 1;

    // Agar REVERSE tashlansa, yo'nalish o'zgaradi
    if (card.value === 'reverse') {
      direction = direction * -1;
    }

    let nextIndex = (currentIndex + direction) % playerIds.length;
    if (nextIndex < 0) nextIndex += playerIds.length;
    
    // Agar SKIP tashlansa, yana bitta odam sakrab o'tiladi
    if (card.value === 'skip') {
      nextIndex = (nextIndex + direction) % playerIds.length;
      if (nextIndex < 0) nextIndex += playerIds.length;
    }
    
    const nextTurnId = playerIds[nextIndex];

    // Baza (Firebase) ni yangilash
    const updates = {};
    updates[`rooms/${roomId}/current_card`] = card;
    updates[`rooms/${roomId}/current_turn`] = nextTurnId;
    updates[`rooms/${roomId}/direction`] = direction;
    updates[`rooms/${roomId}/players/${tgUser.id}/cards`] = myCards;

    await update(ref(db), updates);
  };

  // 2. Kolodadan karta olish (Draw)
  const handleDrawCard = async () => {
    if (!isMyTurn) return;

    const deck = roomData.deck || [];
    if (deck.length === 0) return; // Agar baza kolodasi bo'shab qolsa

    const drawnCard = deck[0]; // Eng tepadagi kartani olamiz
    const newDeck = deck.slice(1); // Kolodani bittaga kamaytiramiz
    const myCards = [...roomData.players[tgUser.id].cards, drawnCard];

    // Karta olgach navbat keyingi odamga o'tadi
    const playerIds = Object.keys(roomData.players);
    const currentIndex = playerIds.indexOf(tgUser.id);
    const direction = roomData.direction || 1;
    let nextIndex = (currentIndex + direction) % playerIds.length;
    if (nextIndex < 0) nextIndex += playerIds.length;
    const nextTurnId = playerIds[nextIndex];

    const updates = {};
    updates[`rooms/${roomId}/deck`] = newDeck;
    updates[`rooms/${roomId}/players/${tgUser.id}/cards`] = myCards;
    updates[`rooms/${roomId}/current_turn`] = nextTurnId;

    await update(ref(db), updates);
  };

  // --- KUTISH EKRANI ---
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
                  <><div className="slot-avatar" style={{background: '#ff5555'}}>Raqib</div><b>Ready</b></>
                ) : ('Matching..')}
              </div>
            ))}
          </div>
          <div className="tips-box">Tips: Har bir raund 3 daqiqa davom etadi.</div>
        </div>
      </div>
    );
  }

  // --- ASOSIY O'YIN EKRANI ---
  const myCards = roomData?.players?.[tgUser?.id]?.cards || [];
  const centerCard = roomData?.current_card;

  return (
    <div className="classic-container">
      <div className="game-screen">
        <div className="globe-table"></div>
        <div className="uno-center-text">UNO</div>

        {/* Raqiblar */}
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

        {/* Markaziy O'yin Stoli (Markaziy Karta va Koloda) */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '30px', alignItems: 'center', zIndex: 15 }}>
          
          {/* Tashlangan Karta */}
          {centerCard && (
            <div className={`uno-card ${getCardClass(centerCard.color)}`} style={{ transform: 'rotate(10deg)', margin: 0, width: '70px', height: '105px', fontSize: '45px' }}>
              <span className="uno-card-value">{getCardDisplayValue(centerCard.value)}</span>
            </div>
          )}

          {/* Karta olish uchun Koloda (Deck) */}
          <div 
            onClick={handleDrawCard}
            className="uno-card-back" 
            style={{ width: '70px', height: '105px', cursor: isMyTurn ? 'pointer' : 'not-allowed', boxShadow: isMyTurn ? '0 0 15px #ffcc00' : '2px 2px 5px rgba(0,0,0,0.5)', transform: isMyTurn ? 'scale(1.05)' : 'scale(1)' }}
          ></div>
        </div>

        {/* O'zimizning HAQIQIY kartalarimiz */}
        <div className="my-hand">
          {myCards.map((card, index) => {
            const totalCards = myCards.length;
            const midPoint = (totalCards - 1) / 2;
            const offset = index - midPoint; 
            const angle = offset * 6; 
            const yTranslate = Math.abs(offset) * 3; 
            const turnBoost = isMyTurn ? -15 : 0; 

            // Navbat bizda bo'lsa va karta to'g'ri kelsa uni yorqinroq ko'rsatamiz
            const isValid = card.color === 'black' || card.color === centerCard?.color || card.value === centerCard?.value;
            const cardOpacity = isMyTurn && !isValid ? 0.7 : 1;

            return (
              <div 
                key={index} 
                onClick={() => handlePlayCard(card, index)}
                className={`uno-card ${getCardClass(card.color)}`}
                style={{
                  transform: `rotate(${angle}deg) translateY(${turnBoost + yTranslate}px)`, 
                  zIndex: index, 
                  boxShadow: isMyTurn ? '0 0 10px rgba(255,255,255,0.3)' : '-3px 5px 10px rgba(0,0,0,0.5)',
                  opacity: cardOpacity
                }}
              >
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
