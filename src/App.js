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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
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
    { name: 'UFC', emoji: '🥊' },
    { name: 'CFB', emoji: '🏈' }
  ];

  const toggleSportsMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    // Check if it's a horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Left swipe (deltaX > 0) and significant distance - open calendar
      if (deltaX > 50) {
        setIsCalendarOpen(true);
      }
      // Right swipe (deltaX < 0) to close calendar
      else if (deltaX < -50 && isCalendarOpen) {
        setIsCalendarOpen(false);
      }
    }

    setTouchStartX(0);
    setTouchStartY(0);
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setIsMenuOpen(false);
  };

  // Calendar functions
  const getDailyTotals = (year, month) => {
    const sportTransactions = allTransactions[selectedSport] || [];
    const dailyTotals = {};

    sportTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!dailyTotals[day]) {
          dailyTotals[day] = 0;
        }
        dailyTotals[day] += transaction.amount;
      }
    });

    return dailyTotals;
  };

  const changeCalendarMonth = (direction) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarDate(newDate);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMonthlyTotal = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const dailyTotals = getDailyTotals(year, month);

    return Object.values(dailyTotals).reduce((sum, amount) => sum + amount, 0);
  };

  const generateCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const dailyTotals = getDailyTotals(year, month);

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDay.getMonth() === month;
      const dayNumber = currentDay.getDate();
      const total = isCurrentMonth ? (dailyTotals[dayNumber] || 0) : 0;

      days.push({
        date: currentDay,
        dayNumber,
        isCurrentMonth,
        total,
        hasTransactions: isCurrentMonth && dailyTotals[dayNumber] !== undefined
      });
    }

    return days;
  };

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDay(day);
      setIsDayDetailsOpen(true);
    }
  };

  const getDayTransactions = (day) => {
    if (!day) return [];

    const sportTransactions = allTransactions[selectedSport] || [];
    return sportTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const dayDate = day.date;
      return (
        transactionDate.getDate() === dayDate.getDate() &&
        transactionDate.getMonth() === dayDate.getMonth() &&
        transactionDate.getFullYear() === dayDate.getFullYear()
      );
    });
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = (updatedTransaction) => {
    const sportTransactions = allTransactions[selectedSport] || [];
    const updatedTransactions = {
      ...allTransactions,
      [selectedSport]: sportTransactions.map(t =>
        t.id === updatedTransaction.id ? updatedTransaction : t
      )
    };
    setAllTransactions(updatedTransactions);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId) => {
    const sportTransactions = allTransactions[selectedSport] || [];
    const updatedTransactions = {
      ...allTransactions,
      [selectedSport]: sportTransactions.filter(t => t.id !== transactionId)
    };
    setAllTransactions(updatedTransactions);
  };

  const handleAddNewTransaction = (type, amount) => {
    if (!selectedDay || !amount || isNaN(amount)) return;

    // Create date for the selected day
    const transactionDate = new Date(selectedDay.date);
    transactionDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const newTransaction = {
      id: Date.now(),
      amount: type === 'loss' ? -parseFloat(amount) : parseFloat(amount),
      sport: selectedSport,
      type: type,
      date: transactionDate.toISOString()
    };

    const currentTransactions = allTransactions[selectedSport] || [];
    const updatedTransactions = {
      ...allTransactions,
      [selectedSport]: [...currentTransactions, newTransaction]
    };

    setAllTransactions(updatedTransactions);
    setIsAddingNew(false);
  };

  const selectedSportData = sports.find(s => s.name === selectedSport);

  // NewTransactionForm component
  const NewTransactionForm = ({ onSave, onCancel }) => {
    const [newAmount, setNewAmount] = useState('');
    const [newType, setNewType] = useState('win');

    const handleSave = () => {
      const amount = parseFloat(newAmount);
      if (!newAmount || isNaN(amount) || amount <= 0) return;
      onSave(newType, newAmount);
    };

    return (
      <div className="new-transaction-form">
        <div className="type-selection">
          <button
            type="button"
            className={`type-btn win-btn ${newType === 'win' ? 'selected' : ''}`}
            onClick={() => setNewType('win')}
          >
            🟢 Win
          </button>
          <button
            type="button"
            className={`type-btn loss-btn ${newType === 'loss' ? 'selected' : ''}`}
            onClick={() => setNewType('loss')}
          >
            🔴 Loss
          </button>
        </div>
        <div className="amount-input-section">
          <input
            type="tel"
            inputMode="decimal"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="new-amount-input"
            placeholder="Enter amount"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button
            onClick={handleSave}
            className="save-btn"
            disabled={!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0}
          >
            Add {newType === 'win' ? 'Win' : 'Loss'}
          </button>
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    );
  };

  // TransactionEditForm component
  const TransactionEditForm = ({ transaction, onSave, onCancel }) => {
    const [editAmount, setEditAmount] = useState(Math.abs(transaction.amount).toString());
    const [editType, setEditType] = useState(transaction.type);

    const handleSave = () => {
      if (!editAmount || isNaN(editAmount)) return;

      const updatedTransaction = {
        ...transaction,
        amount: editType === 'loss' ? -parseFloat(editAmount) : parseFloat(editAmount),
        type: editType
      };

      onSave(updatedTransaction);
    };

    return (
      <div className="transaction-edit-form">
        <div className="edit-form-row">
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="edit-type-select"
          >
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
          <input
            type="tel"
            inputMode="decimal"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="edit-amount-input"
            placeholder="Amount"
          />
        </div>
        <div className="edit-form-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div className="App" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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

      {/* Calendar Component */}
      <div className={`calendar-overlay ${isCalendarOpen ? 'open' : ''}`}>
        <div className="calendar-header">
          <button onClick={() => changeCalendarMonth(-1)} className="nav-btn">‹</button>
          <div className="calendar-title-section">
            <h2 className="calendar-title">{formatMonthYear(currentCalendarDate)}</h2>
            <div className={`monthly-total ${getMonthlyTotal() >= 0 ? 'positive' : 'negative'}`}>
              Total: ${getMonthlyTotal().toFixed(2)}
            </div>
          </div>
          <button onClick={() => changeCalendarMonth(1)} className="nav-btn">›</button>
        </div>
        <div className="calendar-weekdays">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {generateCalendarDays().map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.hasTransactions ? (day.total >= 0 ? 'positive-day' : 'negative-day') : ''} ${day.isCurrentMonth ? 'clickable' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="day-number">{day.dayNumber}</span>
              {day.hasTransactions && (
                <span className="day-amount">${Math.abs(day.total).toFixed(0)}</span>
              )}
            </div>
          ))}
        </div>
        <div className="calendar-footer">
          <button onClick={() => setIsCalendarOpen(false)} className="close-btn">Close</button>
        </div>
      </div>

      {/* Day Details Modal */}
      <div className={`day-details-overlay ${isDayDetailsOpen ? 'open' : ''}`}>
        <div className="day-details-modal">
          <div className="day-details-header">
            <h2>
              {selectedDay && selectedDay.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            <button
              onClick={() => {
                setIsDayDetailsOpen(false);
                setIsAddingNew(false);
                setEditingTransaction(null);
              }}
              className="close-day-details-btn"
            >
              ×
            </button>
          </div>
          <div className="day-transactions">
            {selectedDay && getDayTransactions(selectedDay).map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                {editingTransaction?.id === transaction.id ? (
                  <TransactionEditForm
                    transaction={transaction}
                    onSave={handleUpdateTransaction}
                    onCancel={() => setEditingTransaction(null)}
                  />
                ) : (
                  <div className={`transaction-display ${transaction.type}`}>
                    <div className="transaction-info">
                      <span className="transaction-type">
                        {transaction.type === 'win' ? '🟢 Win' : '🔴 Loss'}
                      </span>
                      <span className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Transaction Section */}
            {selectedDay && !isAddingNew && (
              <div className="add-transaction-section">
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="add-transaction-btn"
                >
                  + Add New Transaction
                </button>
              </div>
            )}

            {isAddingNew && (
              <div className="transaction-item">
                <NewTransactionForm
                  onSave={handleAddNewTransaction}
                  onCancel={() => setIsAddingNew(false)}
                />
              </div>
            )}

            {/* Show message for empty days */}
            {selectedDay && getDayTransactions(selectedDay).length === 0 && !isAddingNew && (
              <div className="empty-day-message">
                <p>No transactions for this day.</p>
                <p>Tap "Add New Transaction" to record a bet.</p>
              </div>
            )}
          </div>
          <div className="day-total">
            <strong>
              Day Total:
              <span className={`${selectedDay && selectedDay.total >= 0 ? 'positive' : 'negative'}`}>
                ${selectedDay ? selectedDay.total.toFixed(2) : '0.00'}
              </span>
            </strong>
          </div>
        </div>
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
