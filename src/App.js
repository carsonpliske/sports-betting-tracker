import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [allTransactions, setAllTransactions] = useState(() => {
    const saved = localStorage.getItem('betting-transactions-all');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeInput, setActiveInput] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSport, setSelectedSport] = useState(() => {
    // Function to get most used sport in past month
    const getMostUsedSport = () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const saved = localStorage.getItem('betting-transactions-all');
      if (!saved) return 'NBA';

      const allTransactions = JSON.parse(saved);
      const sportCounts = {};

      // Count transactions for each sport in the past month
      Object.keys(allTransactions).forEach(sport => {
        const transactions = allTransactions[sport] || [];
        const recentTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= oneMonthAgo;
        });
        sportCounts[sport] = recentTransactions.length;
      });

      // Find sport with most transactions
      let mostUsedSport = 'NBA'; // default fallback
      let maxCount = 0;

      Object.keys(sportCounts).forEach(sport => {
        if (sportCounts[sport] > maxCount) {
          maxCount = sportCounts[sport];
          mostUsedSport = sport;
        }
      });

      return mostUsedSport;
    };

    return getMostUsedSport();
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem('betting-transactions-all', JSON.stringify(allTransactions));
  }, [allTransactions]);

  // Get transactions for current sport
  const currentTransactions = allTransactions[selectedSport] || [];
  const total = currentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const handleSideClick = (type) => {
    setActiveInput(type);
    setAmount('');
  };

  const handleInputKeyDown = (e) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    console.log('Submit called:', { amount, activeInput, selectedSport });
    if (!amount || !activeInput) {
      console.log('Submit failed - missing data');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      amount: activeInput === 'loss' ? -parseFloat(amount) : parseFloat(amount),
      sport: selectedSport,
      type: activeInput,
      date: new Date().toISOString()
    };

    console.log('New transaction:', newTransaction);
    
    // Add transaction to the current sport's data
    const updatedTransactions = {
      ...allTransactions,
      [selectedSport]: [...currentTransactions, newTransaction]
    };
    
    setAllTransactions(updatedTransactions);
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

  const toggleSportsMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setIsMenuOpen(false);
  };

  const selectedSportData = sports.find(s => s.name === selectedSport);

  return (
    <div className="App">
      {/* Sports Menu */}
      <div
        className={`sports-menu ${isMenuOpen ? 'open' : ''}`}
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

      <div className="total-display">
        <div className="sport-header" onClick={toggleSportsMenu}>
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
          onClick={() => !activeInput && handleSideClick('loss')}
        >
          {activeInput === 'loss' && (
            <div className="input-container">
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={(e) => {
                  // Submit if there's a value when losing focus
                  if (amount && amount.trim()) {
                    handleSubmit();
                  } else {
                    handleInputBlur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="inline-input red-input"
                autoFocus
              />
              <button 
                type="button"
                onClick={handleSubmit}
                className="submit-overlay-btn"
                style={{ display: amount ? 'block' : 'none' }}
              >
                ✓
              </button>
            </div>
          )}
        </div>
        
        <div 
          className="side green-side" 
          onClick={() => !activeInput && handleSideClick('win')}
        >
          {activeInput === 'win' && (
            <div className="input-container">
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={(e) => {
                  // Submit if there's a value when losing focus
                  if (amount && amount.trim()) {
                    handleSubmit();
                  } else {
                    handleInputBlur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="inline-input green-input"
                autoFocus
              />
              <button 
                type="button"
                onClick={handleSubmit}
                className="submit-overlay-btn"
                style={{ display: amount ? 'block' : 'none' }}
              >
                ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
