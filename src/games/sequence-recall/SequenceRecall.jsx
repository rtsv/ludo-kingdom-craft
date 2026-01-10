import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import GameModeSelector from "../../components/game/GameModeSelector";
import styles from "./SequenceRecall.module.css";

// Tile colors matching the design
const TILE_COLORS = [
  { name: 'red', class: 'tileRed' },
  { name: 'blue', class: 'tileBlue' },
  { name: 'green', class: 'tileGreen' },
  { name: 'yellow', class: 'tileYellow' },
  { name: 'orange', class: 'tileOrange' },
  { name: 'purple', class: 'tilePurple' },
  { name: 'pink', class: 'tilePink' },
  { name: 'teal', class: 'tileTeal' },
  { name: 'cyan', class: 'tileCyan' },
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { 
    gridSize: 3, 
    initialSpeed: 800, 
    speedDecrease: 30, 
    minSpeed: 400,
    label: 'Easy'
  },
  medium: { 
    gridSize: 3, 
    initialSpeed: 600, 
    speedDecrease: 40, 
    minSpeed: 300,
    label: 'Medium'
  },
  hard: { 
    gridSize: 4, 
    initialSpeed: 500, 
    speedDecrease: 50, 
    minSpeed: 200,
    label: 'Hard'
  },
};

function SequenceRecall({ onBack }) {
  // Game flow states
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  
  // Setup states
  const [difficulty, setDifficulty] = useState('medium');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [playerNames, setPlayerNames] = useState(['', '']);
  
  // Game states
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [round, setRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false); // sequence is playing
  const [isInputEnabled, setIsInputEnabled] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [wrongTile, setWrongTile] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  
  // Multiplayer states
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  
  // High score (localStorage)
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  const timeoutRef = useRef(null);
  
  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`sequenceRecall_highScore_${difficulty}`);
    if (saved) setHighScore(parseInt(saved, 10));
  }, [difficulty]);
  
  // Get settings based on difficulty
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const gridSize = settings.gridSize;
  const tileCount = gridSize * gridSize;
  
  // Calculate current speed based on round
  const getCurrentSpeed = useCallback(() => {
    const { initialSpeed, speedDecrease, minSpeed } = settings;
    return Math.max(minSpeed, initialSpeed - (round - 1) * speedDecrease);
  }, [settings, round]);
  
  // Get tiles for the grid
  const tiles = TILE_COLORS.slice(0, tileCount);
  
  // Generate next sequence element
  const addToSequence = useCallback(() => {
    const newElement = Math.floor(Math.random() * tileCount);
    setSequence(prev => [...prev, newElement]);
  }, [tileCount]);
  
  // Play the sequence animation
  const playSequence = useCallback(async (seq) => {
    setIsPlaying(true);
    setIsInputEnabled(false);
    setActiveTile(null);
    
    const speed = getCurrentSpeed();
    
    // Wait before starting
    await new Promise(r => setTimeout(r, 500));
    
    for (let i = 0; i < seq.length; i++) {
      setActiveTile(seq[i]);
      await new Promise(r => setTimeout(r, speed));
      setActiveTile(null);
      await new Promise(r => setTimeout(r, speed / 3));
    }
    
    setIsPlaying(false);
    setIsInputEnabled(true);
  }, [getCurrentSpeed]);
  
  // Start a new round
  const startRound = useCallback(() => {
    setPlayerInput([]);
    setWrongTile(null);
    addToSequence();
  }, [addToSequence]);
  
  // Effect to play sequence when it changes
  useEffect(() => {
    if (sequence.length > 0 && gameStarted && !gameOver) {
      playSequence(sequence);
    }
  }, [sequence, gameStarted, gameOver, playSequence]);
  
  // Handle tile click
  const handleTileClick = (index) => {
    if (!isInputEnabled || isPlaying || gameOver) return;
    
    const expectedIndex = playerInput.length;
    const expected = sequence[expectedIndex];
    
    // Flash the clicked tile
    setActiveTile(index);
    setTimeout(() => setActiveTile(null), 150);
    
    if (index === expected) {
      // Correct!
      const newInput = [...playerInput, index];
      setPlayerInput(newInput);
      
      if (newInput.length === sequence.length) {
        // Completed the sequence!
        setIsInputEnabled(false);
        
        if (isMultiplayer) {
          // Update score for current player
          const newScores = [...scores];
          newScores[currentPlayerIndex] = round;
          setScores(newScores);
        }
        
        // Next round
        setTimeout(() => {
          setRound(r => r + 1);
          startRound();
        }, 800);
      }
    } else {
      // Wrong!
      setWrongTile(index);
      setIsInputEnabled(false);
      
      setTimeout(() => {
        setWrongTile(null);
        
        if (isMultiplayer) {
          // Update score and switch player
          const newScores = [...scores];
          newScores[currentPlayerIndex] = round - 1;
          setScores(newScores);
          
          if (currentPlayerIndex === 0) {
            // Switch to player 2
            setCurrentPlayerIndex(1);
            setSequence([]);
            setPlayerInput([]);
            setRound(1);
            setTimeout(() => startRound(), 500);
          } else {
            // Both players done - game over
            handleGameOver(newScores);
          }
        } else {
          // Single player game over
          handleGameOver();
        }
      }, 600);
    }
  };
  
  // Handle game over
  const handleGameOver = (finalScores = scores) => {
    const finalScore = isMultiplayer ? Math.max(...finalScores) : round - 1;
    
    // Check high score for single player
    if (!isMultiplayer && finalScore > highScore) {
      setHighScore(finalScore);
      setIsNewHighScore(true);
      localStorage.setItem(`sequenceRecall_highScore_${difficulty}`, finalScore.toString());
    }
    
    setGameOver(true);
  };
  
  // Start the game
  const startGame = () => {
    const validNames = playerNames.map((name, i) => 
      name.trim() || `Player ${i + 1}`
    );
    setPlayerNames(validNames);
    setGameStarted(true);
    setSequence([]);
    setPlayerInput([]);
    setRound(1);
    setScores([0, 0]);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setIsNewHighScore(false);
    
    // Start first round
    setTimeout(() => startRound(), 500);
  };
  
  // Restart game
  const restartGame = () => {
    setSequence([]);
    setPlayerInput([]);
    setRound(1);
    setScores([0, 0]);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setIsNewHighScore(false);
    
    setTimeout(() => startRound(), 500);
  };
  
  // Go back to setup
  const goToSetup = () => {
    setGameStarted(false);
    setGameOver(false);
    setSequence([]);
  };
  
  // Go back handler
  const handleBack = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (gameStarted) {
      goToSetup();
    } else if (gameMode) {
      setGameMode(null);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Get current player name
  const getCurrentPlayerName = () => {
    if (!isMultiplayer) return playerNames[0];
    return playerNames[currentPlayerIndex];
  };
  
  // Determine winner in multiplayer
  const getWinner = () => {
    if (scores[0] > scores[1]) return 0;
    if (scores[1] > scores[0]) return 1;
    return -1; // tie
  };
  
  // ========== RENDER: Mode Selection ==========
  if (!gameMode) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🧠 Sequence Recall</h1>
          <p className={styles.setupSubtitle}>Test your memory!</p>
          
          <div className={styles.rulesBox}>
            <strong>How to Play: </strong>
            <span>
              Watch the sequence of tiles light up, then repeat the pattern. 
              Each round adds one more tile to remember!
            </span>
          </div>
          
          <GameModeSelector
            onSelectLocal={() => setGameMode('local')}
            onSelectOnline={() => setGameMode('online')}
            localLabel="Play Solo"
            onlineLabel="2 Player Local"
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
          <h1 className={styles.setupTitle}>🧠 Sequence Recall</h1>
          <p className={styles.setupSubtitle}>
            {gameMode === 'online' ? '2 Player Mode' : 'Solo Mode'}
          </p>
          
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
          
          {/* Player Name Input */}
          <div className={styles.section}>
            <label className={styles.label}>
              {gameMode === 'online' ? 'Player Names' : 'Your Name'}
            </label>
            
            <div className={styles.playerInputRow}>
              <span className={styles.playerLabel}>
                {gameMode === 'online' ? 'P1:' : 'Name:'}
              </span>
              <input
                type="text"
                value={playerNames[0]}
                onChange={(e) => setPlayerNames([e.target.value, playerNames[1]])}
                placeholder="Player 1"
                className={styles.input}
                maxLength={15}
              />
            </div>
            
            {gameMode === 'online' && (
              <div className={styles.playerInputRow}>
                <span className={styles.playerLabel}>P2:</span>
                <input
                  type="text"
                  value={playerNames[1]}
                  onChange={(e) => setPlayerNames([playerNames[0], e.target.value])}
                  placeholder="Player 2"
                  className={styles.input}
                  maxLength={15}
                />
              </div>
            )}
          </div>
          
          {/* Multiplayer toggle for online mode */}
          {gameMode === 'online' && (
            <div 
              style={{ display: 'none' }}
              onClick={() => setIsMultiplayer(true)}
            />
          )}
          
          {/* Start Button */}
          <div className={styles.startBtnWrapper}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
              onClick={() => {
                setIsMultiplayer(gameMode === 'online');
                startGame();
              }}
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
          
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreStat}>
              <div className={styles.scoreLabel}>Round</div>
              <div className={styles.scoreValue}>{round}</div>
            </div>
            {!isMultiplayer && (
              <div className={styles.scoreStat}>
                <div className={styles.scoreLabel}>Best</div>
                <div className={styles.scoreValue}>{highScore}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Multiplayer Player Info */}
        {isMultiplayer && (
          <div className={styles.playerInfo}>
            {playerNames.map((name, idx) => (
              <div 
                key={idx}
                className={`${styles.playerCard} ${currentPlayerIndex === idx ? styles.active : ''}`}
              >
                <span className={styles.playerName}>{name}</span>
                <span className={styles.playerScore}>{scores[idx]}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={`${styles.statusText} ${isPlaying ? styles.watching : ''}`}>
            {isPlaying 
              ? '👀 Watch the sequence...' 
              : isInputEnabled 
                ? `🎯 ${isMultiplayer ? getCurrentPlayerName() + "'s turn - " : ''}Repeat the pattern!`
                : 'Get ready...'}
          </div>
        </div>
        
        {/* Tile Grid */}
        <div className={styles.gridWrapper}>
          <div className={`${styles.tileGrid} ${gridSize === 3 ? styles.grid3x3 : styles.grid4x4}`}>
            {tiles.map((tile, index) => (
              <button
                key={index}
                className={`
                  ${styles.tile} 
                  ${styles[tile.class]}
                  ${activeTile === index ? styles.active : ''}
                  ${wrongTile === index ? styles.wrong : ''}
                  ${!isInputEnabled || isPlaying ? styles.disabled : ''}
                `}
                onClick={() => handleTileClick(index)}
                disabled={!isInputEnabled || isPlaying}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Game Over Overlay */}
      {gameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverContent}>
            <div className={styles.gameOverTitle}>
              {isMultiplayer ? '🏆 Game Over!' : '💥 Game Over!'}
            </div>
            
            {isMultiplayer ? (
              <>
                <div className={styles.finalScores}>
                  {playerNames.map((name, idx) => (
                    <div 
                      key={idx}
                      className={`${styles.finalScoreRow} ${getWinner() === idx ? styles.winner : ''}`}
                    >
                      <span className={styles.playerName}>
                        {name}
                        {getWinner() === idx && <span className={styles.winnerBadge}>👑</span>}
                      </span>
                      <span className={styles.playerScore}>{scores[idx]} rounds</span>
                    </div>
                  ))}
                </div>
                {getWinner() === -1 && (
                  <div className={styles.gameOverLabel}>It's a tie!</div>
                )}
              </>
            ) : (
              <>
                <div className={styles.gameOverLabel}>You reached</div>
                <div className={styles.gameOverScore}>Round {round - 1}</div>
                
                {isNewHighScore && (
                  <div className={styles.newHighScore}>🎉 New High Score!</div>
                )}
                
                <div className={styles.highScoreDisplay}>
                  Best: {highScore} rounds
                </div>
              </>
            )}
            
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

export default SequenceRecall;
