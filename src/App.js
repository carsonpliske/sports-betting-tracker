import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('betting-transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeInput, setActiveInput] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [touchStartY, setTouchStartY] = useState(0);
  const [menuOffset, setMenuOffset] = useState(-100);
  const [isMenuGesture, setIsMenuGesture] = useState(false);
  useEffect(() => {
    localStorage.setItem('betting-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const handleSideClick = (type) => {
    setActiveInput(type);
    setAmount('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Done') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!amount || !activeInput) return;

    const newTransaction = {
      id: Date.now(),
      amount: activeInput === 'loss' ? -parseFloat(amount) : parseFloat(amount),
      sport: selectedSport,
      type: activeInput,
      date: new Date().toISOString()
    };

    setTransactions([...transactions, newTransaction]);
    setActiveInput('');
    setAmount('');
  };

  const handleInputBlur = () => {
    setActiveInput('');
    setAmount('');
  };

  const sports = [
    { name: 'NBA', emoji: '🏀' },
    { name: 'NFL', emoji: '🏈' },
    { name: 'MLB', emoji: '⚾' },
    { name: 'UFC', emoji: '🥊' }
  ];

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsMenuGesture(false);
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;
    
    // Pull down from top to open menu
    if (touchStartY < 50 && deltaY > 0) {
      e.preventDefault(); // Prevent default scroll behavior
      setIsMenuGesture(true);
      const offset = Math.min(deltaY - 50, 150);
      setMenuOffset(-100 + (offset / 150) * 100);
    }
    // Swipe up when menu is open to close it
    else if (menuOffset > -100 && deltaY < 0) {
      e.preventDefault(); // Prevent default scroll behavior
      setIsMenuGesture(true);
      const closeOffset = Math.max(menuOffset + (deltaY / 150) * 100, -100);
      setMenuOffset(closeOffset);
    }
  };

  const handleTouchEnd = () => {
    if (menuOffset > -50) {
      setMenuOffset(0);
    } else {
      setMenuOffset(-100);
    }
    // Reset gesture flag after a brief delay to ensure touch events don't interfere
    setTimeout(() => setIsMenuGesture(false), 100);
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setMenuOffset(-100);
  };

  const selectedSportData = sports.find(s => s.name === selectedSport);

  return (
    <div className="App">
      {/* Hidden Sports Menu */}
      <div 
        className="sports-menu" 
        style={{ transform: `translateY(${menuOffset}%)` }}
      >
        {sports.map((sport) => (
          <div 
            key={sport.name}
            className="sport-option"
            onClick={() => handleSportSelect(sport.name)}
          >
            <span className="sport-emoji">{sport.emoji}</span>
            <span className="sport-text">{sport.name}</span>
          </div>
        ))}
      </div>

      <div 
        className="total-display"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sport-header">
          <div className="logo-placeholder">{selectedSportData?.emoji}</div>
          <span className="sport-name">{selectedSport}</span>
        </div>
        <h1 className={total >= 0 ? 'positive' : 'negative'}>
          ${total.toFixed(2)}
        </h1>
        <p>{total >= 0 ? 'Profit' : 'Loss'}</p>
      </div>
      
      <div className="split-container">
        <div 
          className="side red-side" 
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (!activeInput && !isMenuGesture) {
              handleSideClick('loss');
            }
          }}
          onClick={() => !activeInput && !isMenuGesture && handleSideClick('loss')}
        >
          {activeInput === 'loss' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="inline-input red-input"
                autoFocus
              />
            </form>
          )}
        </div>
        
        <div 
          className="side green-side" 
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (!activeInput && !isMenuGesture) {
              handleSideClick('win');
            }
          }}
          onClick={() => !activeInput && !isMenuGesture && handleSideClick('win')}
        >
          {activeInput === 'win' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="inline-input green-input"
                autoFocus
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
