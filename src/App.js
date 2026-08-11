import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const CHART_RANGES = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' }
];

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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setNewType('win');
          }}
        >
          🟢 Win
        </button>
        <button
          type="button"
          className={`type-btn loss-btn ${newType === 'loss' ? 'selected' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setNewType('loss');
          }}
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
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          className="save-btn"
          disabled={!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0}
        >
          Add {newType === 'win' ? 'Win' : 'Loss'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          className="cancel-btn"
        >
          Cancel
        </button>
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

// LineChart component - touch-scrubbable equity curve
const LineChart = ({ points }) => {
  const [scrubIndex, setScrubIndex] = useState(null);
  const containerRef = useRef(null);

  if (points.length < 2) {
    return (
      <div className="line-chart-empty">
        <p>Not enough data yet for this range.</p>
      </div>
    );
  }

  const lastIndex = points.length - 1;
  const values = points.map((p) => p.y);
  const minY = Math.min(...values, 0);
  const maxY = Math.max(...values, 0);
  const spanY = maxY - minY || 1;

  const xForIndex = (i) => (i / lastIndex) * 100;
  const yForValue = (v) => 100 - ((v - minY) / spanY) * 100;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(2)} ${yForValue(p.y).toFixed(2)}`)
    .join(' ');

  const activeIndex = scrubIndex !== null ? scrubIndex : lastIndex;
  const activePoint = points[activeIndex];

  const updateScrub = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setScrubIndex(Math.round(pct * lastIndex));
  };

  const isIntraday = points[lastIndex].date - points[0].date <= 24 * 60 * 60 * 1000;
  const formattedDate = isIntraday
    ? activePoint.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : activePoint.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="line-chart-wrapper">
      <div className="chart-scrub-label">
        <span className="chart-scrub-date">{formattedDate}</span>
        <span className={`chart-scrub-value ${activePoint.y >= 0 ? 'positive' : 'negative'}`}>
          ${activePoint.y.toFixed(2)}
        </span>
      </div>
      <div
        className="line-chart-container"
        ref={containerRef}
        onTouchStart={(e) => updateScrub(e.touches[0].clientX)}
        onTouchMove={(e) => updateScrub(e.touches[0].clientX)}
        onTouchEnd={() => setScrubIndex(null)}
        onMouseDown={(e) => updateScrub(e.clientX)}
        onMouseMove={(e) => { if (e.buttons === 1) updateScrub(e.clientX); }}
        onMouseUp={() => setScrubIndex(null)}
        onMouseLeave={() => setScrubIndex(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
          <line
            x1="0"
            y1={yForValue(0).toFixed(2)}
            x2="100"
            y2={yForValue(0).toFixed(2)}
            className="chart-zero-line"
          />
          <path
            d={pathD}
            className={`chart-path ${activePoint.y >= 0 ? 'positive-line' : 'negative-line'}`}
          />
          {scrubIndex !== null && (
            <line
              x1={xForIndex(scrubIndex).toFixed(2)}
              y1="0"
              x2={xForIndex(scrubIndex).toFixed(2)}
              y2="100"
              className="chart-scrub-line"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSeasonsOpen, setIsSeasonsOpen] = useState(false);
  const [chartRange, setChartRange] = useState('week');
  useEffect(() => {
    localStorage.setItem('betting-transactions-all', JSON.stringify(allTransactions));
  }, [allTransactions]);

  // Get transactions for current sport
  const currentTransactions = allTransactions[selectedSport] || [];

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
    const numAmount = parseFloat(amount);
    if (!selectedDay || !amount || isNaN(numAmount) || numAmount <= 0) {
      console.log('Invalid input:', { selectedDay, amount, numAmount });
      return;
    }

    // Create date for the selected day
    const transactionDate = new Date(selectedDay.date);
    transactionDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const newTransaction = {
      id: Date.now(),
      amount: type === 'loss' ? -numAmount : numAmount,
      sport: selectedSport,
      type: type,
      date: transactionDate.toISOString()
    };

    console.log('Adding new transaction:', newTransaction);

    const currentTransactions = allTransactions[selectedSport] || [];
    const updatedTransactions = {
      ...allTransactions,
      [selectedSport]: [...currentTransactions, newTransaction]
    };

    setAllTransactions(updatedTransactions);
    setIsAddingNew(false);

    // Update the selected day to reflect the new transaction
    const updatedDay = {
      ...selectedDay,
      hasTransactions: true,
      total: (selectedDay.total || 0) + newTransaction.amount
    };
    setSelectedDay(updatedDay);
  };

  // Season helpers
  // NBA/NFL/CFB span two calendar years (e.g. "2025-26"); MLB/UFC are single-year.
  const getSeasonInfo = (sport, date) => {
    const month = date.getMonth(); // 0 = Jan
    const year = date.getFullYear();
    const spanLabel = (startYear) => `${startYear}-${(startYear + 1).toString().slice(-2)}`;

    switch (sport) {
      case 'NBA': {
        const startYear = month >= 9 ? year : year - 1; // season starts with preseason in October
        return { label: spanLabel(startYear), startYear };
      }
      case 'NFL': {
        const startYear = month >= 7 ? year : year - 1; // season starts with preseason in August
        return { label: spanLabel(startYear), startYear };
      }
      case 'CFB': {
        const startYear = month >= 7 ? year : year - 1; // season starts August
        return { label: spanLabel(startYear), startYear };
      }
      default: // MLB, UFC - calendar year season
        return { label: `${year}`, startYear: year };
    }
  };

  const getSeasonTotals = (sport) => {
    const sportTransactions = allTransactions[sport] || [];
    const totalsByLabel = {};

    sportTransactions.forEach((transaction) => {
      const { label, startYear } = getSeasonInfo(sport, new Date(transaction.date));
      if (!totalsByLabel[label]) {
        totalsByLabel[label] = { label, startYear, total: 0 };
      }
      totalsByLabel[label].total += transaction.amount;
    });

    // Always show the current season, even before any bets are logged for it
    const current = getSeasonInfo(sport, new Date());
    if (!totalsByLabel[current.label]) {
      totalsByLabel[current.label] = { label: current.label, startYear: current.startYear, total: 0 };
    }

    return Object.values(totalsByLabel).sort((a, b) => b.startYear - a.startYear);
  };

  // Main display shows the current season's profit/loss, not the all-time total
  const currentSeasonInfo = getSeasonInfo(selectedSport, new Date());
  const total = currentTransactions
    .filter((transaction) => getSeasonInfo(selectedSport, new Date(transaction.date)).label === currentSeasonInfo.label)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Builds a cumulative running-total series, reset to $0 at the start of the selected range
  const getChartPoints = (sport, range) => {
    const sportTransactions = (allTransactions[sport] || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const now = new Date();
    let start;
    switch (range) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        break;
      case 'year':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 364);
        break;
      default: // all
        start = sportTransactions.length ? new Date(sportTransactions[0].date) : now;
    }

    const windowTransactions = sportTransactions.filter((t) => new Date(t.date) >= start);

    const points = [{ date: start, y: 0 }];
    let running = 0;
    windowTransactions.forEach((t) => {
      running += t.amount;
      points.push({ date: new Date(t.date), y: running });
    });

    // Extend the line to "now" so it doesn't dead-end at the last bet
    if (points[points.length - 1].date < now) {
      points.push({ date: now, y: running });
    }

    return points;
  };

  const chartPoints = getChartPoints(selectedSport, chartRange);
  const chartPeak = chartPoints.reduce((max, p) => (p.y > max.y ? p : max), chartPoints[0]);
  const chartLow = chartPoints.reduce((min, p) => (p.y < min.y ? p : min), chartPoints[0]);

  const selectedSportData = sports.find(s => s.name === selectedSport);

  return (
    <div className="App" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Sports Bar - always-visible sport selector */}
      <div className="sports-bar">
        {sports.map((sport) => (
          <button
            key={sport.name}
            type="button"
            className={`sports-bar-icon ${selectedSport === sport.name ? 'selected' : ''}`}
            onClick={() => handleSportSelect(sport.name)}
          >
            {sport.emoji}
          </button>
        ))}
      </div>

      {/* Mini Bet Bar - condensed win/loss entry, replaces the old full-height split view */}
      <div className="mini-bet-bar">
        <div
          className="mini-side mini-red"
          onClick={() => !activeInput && handleSideClick('loss')}
        >
          {activeInput === 'loss' && (
            <div className="mini-input-container">
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => {
                  if (amount && amount.trim()) {
                    handleSubmit();
                  } else {
                    handleInputBlur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="mini-inline-input"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="mini-submit-btn"
                style={{ display: amount ? 'flex' : 'none' }}
              >
                ✓
              </button>
            </div>
          )}
        </div>

        <div
          className="mini-side mini-green"
          onClick={() => !activeInput && handleSideClick('win')}
        >
          {activeInput === 'win' && (
            <div className="mini-input-container">
              <input
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => {
                  if (amount && amount.trim()) {
                    handleSubmit();
                  } else {
                    handleInputBlur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="mini-inline-input"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="mini-submit-btn"
                style={{ display: amount ? 'flex' : 'none' }}
              >
                ✓
              </button>
            </div>
          )}
        </div>
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

      {/* Seasons Overlay */}
      <div className={`seasons-overlay ${isSeasonsOpen ? 'open' : ''}`}>
        <div className="seasons-header">
          <h2 className="seasons-title">{selectedSportData?.emoji} {selectedSport} Seasons</h2>
          <button
            onClick={() => setIsSeasonsOpen(false)}
            className="close-day-details-btn"
          >
            ×
          </button>
        </div>
        <div className="seasons-list">
          {getSeasonTotals(selectedSport).map((season) => (
            <div key={season.label} className="season-row">
              <span className="season-label">{season.label}</span>
              <span className={`season-total ${season.total >= 0 ? 'positive' : 'negative'}`}>
                ${season.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="calendar-footer">
          <button onClick={() => setIsSeasonsOpen(false)} className="close-btn">Close</button>
        </div>
      </div>

      <div className="total-display">
        <div className="sport-header">
          <div className="logo-placeholder">{selectedSportData?.emoji}</div>
          <span className="sport-name">{selectedSport}</span>
          <span className="season-tag">{currentSeasonInfo.label}</span>
        </div>
        <h1 className={total >= 0 ? 'positive' : 'negative'}>
          ${total.toFixed(2)}
        </h1>
        <button
          type="button"
          className="view-seasons-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsSeasonsOpen(true);
          }}
        >
          View Seasons
        </button>
      </div>

      <div className="chart-section">
        <div className="range-tabs">
          {CHART_RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`range-tab ${chartRange === option.key ? 'selected' : ''}`}
              onClick={() => setChartRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <LineChart points={chartPoints} />
        <div className="chart-stats-row">
          <div className="chart-stat">
            <span className="chart-stat-label">Peak</span>
            <span className={`chart-stat-value ${chartPeak.y >= 0 ? 'positive' : 'negative'}`}>
              ${chartPeak.y.toFixed(2)}
            </span>
            <span className="chart-stat-date">
              {chartPeak.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="chart-stat">
            <span className="chart-stat-label">Low</span>
            <span className={`chart-stat-value ${chartLow.y >= 0 ? 'positive' : 'negative'}`}>
              ${chartLow.y.toFixed(2)}
            </span>
            <span className="chart-stat-date">
              {chartLow.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
