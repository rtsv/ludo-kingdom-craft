import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import GameModeSelector from "../../components/game/GameModeSelector";
import styles from "./NumberRecallTiles.module.css";

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    revealDuration: 800, // Number stays visible briefly after correct click
    useRandomSequence: false,
  },
  medium: {
    label: 'Medium',
    revealDuration: 0, // Number hides immediately
    useRandomSequence: false,
  },
  hard: {
    label: 'Hard',
    revealDuration: 0,
    useRandomSequence: true, // Random sequence order
  },
};

// Shuffle array helper
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function NumberRecallTiles({ onBack }) {
  // Game flow states
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  
  // Setup states
  const [difficulty, setDifficulty] = useState('medium');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  
  // Game states
  const [tilePositions, setTilePositions] = useState([]); // Maps grid index to number
  const [requiredSequence, setRequiredSequence] = useState([]); // The order to click (1-9 or random)
  const [currentExpectedIndex, setCurrentExpectedIndex] = useState(0); // Index in requiredSequence
  const [revealedTiles, setRevealedTiles] = useState([]); // Grid indices that are revealed
  const [wrongTile, setWrongTile] = useState(null);
  const [correctTile, setCorrectTile] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Multiplayer states
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // Preview state (show numbers at start)
  const [isPreview, setIsPreview] = useState(false);
  
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Initialize game
  const initializeGame = useCallback(() => {
    // Create tile positions: shuffle numbers 1-9
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledPositions = shuffleArray(numbers);
    setTilePositions(shuffledPositions);
    
    // Create required sequence based on difficulty
    let sequence;
    if (settings.useRandomSequence) {
      sequence = shuffleArray(numbers);
    } else {
      sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    setRequiredSequence(sequence);
    
    // Reset states
    setCurrentExpectedIndex(0);
    setRevealedTiles([]);
    setWrongTile(null);
    setCorrectTile(null);
    setIsResetting(false);
    setGameOver(false);
    setWinner(null);
    
    // Show preview briefly
    setIsPreview(true);
    setTimeout(() => {
      setIsPreview(false);
    }, 2000);
  }, [settings.useRandomSequence]);
  
  // Start the game
  const startGame = () => {
    const validNames = playerNames.map((name, i) => 
      name.trim() || `Player ${i + 1}`
    );
    setPlayerNames(validNames);
    setGameStarted(true);
    setCurrentPlayerIndex(0);
    initializeGame();
  };
  
  // Handle tile click
  const handleTileClick = (gridIndex) => {
    if (isResetting || isPreview || gameOver) return;
    
    const clickedNumber = tilePositions[gridIndex];
    const expectedNumber = requiredSequence[currentExpectedIndex];
    
    if (clickedNumber === expectedNumber) {
      // Correct click!
      setCorrectTile(gridIndex);
      
      // Reveal the tile based on difficulty
      if (settings.revealDuration > 0) {
        setRevealedTiles(prev => [...prev, gridIndex]);
        setTimeout(() => {
          setRevealedTiles(prev => prev.filter(i => i !== gridIndex));
        }, settings.revealDuration);
      }
      
      setTimeout(() => setCorrectTile(null), 300);
      
      const nextIndex = currentExpectedIndex + 1;
      
      if (nextIndex >= 9) {
        // Player completed the sequence - they win!
        setRevealedTiles([0, 1, 2, 3, 4, 5, 6, 7, 8]); // Reveal all
        setWinner(currentPlayerIndex);
        setGameOver(true);
      } else {
        setCurrentExpectedIndex(nextIndex);
      }
    } else {
      // Wrong click - end turn
      setWrongTile(gridIndex);
      setIsResetting(true);
      
      setTimeout(() => {
        setWrongTile(null);
        
        // Switch to next player
        const nextPlayer = (currentPlayerIndex + 1) % playerCount;
        setCurrentPlayerIndex(nextPlayer);
        
        // Reset for next player's turn
        setRevealedTiles([]);
        setCurrentExpectedIndex(0);
        
        // Shuffle tile positions for fairness
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        setTilePositions(shuffleArray(numbers));
        
        // Generate new random sequence for hard mode
        if (settings.useRandomSequence) {
          setRequiredSequence(shuffleArray(numbers));
        }
        
        // Brief preview for new player
        setIsPreview(true);
        setTimeout(() => {
          setIsPreview(false);
          setIsResetting(false);
        }, 2000);
      }, 800);
    }
  };
  
  // Restart game
  const restartGame = () => {
    setCurrentPlayerIndex(0);
    initializeGame();
  };
  
  // Go back to setup
  const goToSetup = () => {
    setGameStarted(false);
    setGameOver(false);
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (gameStarted) {
      goToSetup();
    } else if (gameMode) {
      setGameMode(null);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Get current player name
  const getCurrentPlayerName = () => playerNames[currentPlayerIndex];
  
  // ========== RENDER: Mode Selection ==========
  if (!gameMode) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🔢 Number Recall</h1>
          <p className={styles.setupSubtitle}>Memory Tiles Challenge</p>
          
          <div className={styles.rulesBox}>
            <strong>How to Play: </strong>
            <span>
              Tiles hide numbers 1-9. Click them in the correct sequence order. 
              Click wrong, and your turn ends!
            </span>
          </div>
          
          <GameModeSelector
            onSelectLocal={() => setGameMode('local')}
            onSelectOnline={() => setGameMode('online')}
            localLabel="2 Players"
            onlineLabel="3+ Players"
            maxPlayers="Take turns on same device"
          />
        </div>
      </div>
    );
  }
  
  // ========== RENDER: Setup Screen ==========
  if (!gameStarted) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🔢 Number Recall</h1>
          <p className={styles.setupSubtitle}>
            {gameMode === 'online' ? 'Multiplayer Mode' : '2 Player Mode'}
          </p>
          
          {/* Player Count (for online mode) */}
          {gameMode === 'online' && (
            <div className={styles.section}>
              <label className={styles.label}>Number of Players</label>
              <div className={styles.difficultyButtons}>
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    className={`${styles.btn} ${playerCount === count ? styles.btnActive : styles.btnSecondary}`}
                    onClick={() => {
                      setPlayerCount(count);
                      setPlayerNames(prev => {
                        const newNames = [...prev];
                        while (newNames.length < count) newNames.push('');
                        return newNames.slice(0, count);
                      });
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Difficulty Selection */}
          <div className={styles.section}>
            <label className={styles.label}>Select Difficulty</label>
            <div className={styles.difficultyButtons}>
              {Object.entries(DIFFICULTY_SETTINGS).map(([key, val]) => (
                <button
                  key={key}
                  className={`${styles.btn} ${difficulty === key ? styles.btnActive : styles.btnSecondary}`}
                  onClick={() => setDifficulty(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Player Name Inputs */}
          <div className={styles.section}>
            <label className={styles.label}>Player Names</label>
            {playerNames.slice(0, playerCount).map((name, idx) => (
              <div key={idx} className={styles.playerInputRow}>
                <span className={styles.playerLabel}>P{idx + 1}:</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[idx] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Player ${idx + 1}`}
                  className={styles.input}
                  maxLength={15}
                />
              </div>
            ))}
          </div>
          
          {/* Start Button */}
          <div className={styles.startBtnWrapper}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
          
          {/* Back Button */}
          <div className={styles.startBtnWrapper} style={{ marginTop: '0.75rem' }}>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => setGameMode(null)}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ========== RENDER: Game Screen ==========
  return (
    <div className={styles.gamePage}>
      <div className={styles.gameContainer}>
        {/* Header */}
        <div className={styles.gameHeader}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          
          <div className={styles.currentPlayerDisplay}>
            <div className={styles.currentPlayerLabel}>Current Turn</div>
            <div className={styles.currentPlayerName}>{getCurrentPlayerName()}</div>
          </div>
        </div>
        
        {/* Player Cards */}
        <div className={styles.playerInfo}>
          {playerNames.slice(0, playerCount).map((name, idx) => (
            <div 
              key={idx}
              className={`${styles.playerCard} ${currentPlayerIndex === idx ? styles.active : ''}`}
            >
              <span className={styles.playerName}>{name}</span>
              {currentPlayerIndex === idx && (
                <span className={styles.turnIndicator}>Playing</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Sequence Display (Hard Mode) */}
        {settings.useRandomSequence && (
          <div className={styles.sequenceDisplay}>
            <div className={styles.sequenceLabel}>Required Order</div>
            <div className={styles.sequenceNumbers}>
              {requiredSequence.join(' → ')}
            </div>
          </div>
        )}
        
        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={`${styles.statusText} ${isPreview ? styles.highlight : ''}`}>
            {isPreview 
              ? '👀 Memorize the positions!'
              : isResetting
                ? 'Wrong! Switching turns...'
                : `🎯 Find: ${requiredSequence[currentExpectedIndex]} (${currentExpectedIndex + 1}/9)`
            }
          </div>
        </div>
        
        {/* Tile Grid */}
        <div className={styles.gridWrapper}>
          <div className={styles.tileGrid}>
            {tilePositions.map((number, gridIndex) => {
              const isRevealed = revealedTiles.includes(gridIndex);
              const isWrong = wrongTile === gridIndex;
              const isCorrect = correctTile === gridIndex;
              const isPreviewTile = isPreview;
              
              return (
                <button
                  key={gridIndex}
                  className={`
                    ${styles.tile}
                    ${isRevealed ? styles.revealed : ''}
                    ${isWrong ? styles.wrong : ''}
                    ${isCorrect ? styles.correct : ''}
                    ${isPreviewTile ? styles.preview : ''}
                    ${isResetting || isPreview ? styles.disabled : ''}
                  `}
                  onClick={() => handleTileClick(gridIndex)}
                  disabled={isResetting || isPreview || gameOver}
                >
                  {(isRevealed || isWrong || isCorrect || isPreviewTile) ? number : '?'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Game Over Overlay */}
      {gameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverContent}>
            <div className={styles.gameOverTitle}>🏆 Winner!</div>
            <div className={styles.winnerName}>{playerNames[winner]}</div>
            <div className={styles.gameOverMessage}>
              Completed the entire sequence!
            </div>
            
            <div className={styles.gameOverButtons}>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
                onClick={restartGame}
              >
                Play Again
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={goToSetup}
              >
                Change Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NumberRecallTiles;
