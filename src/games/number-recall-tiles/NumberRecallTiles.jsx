import { useState, useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import GameModeSelector from "../../components/game/GameModeSelector";
import OnlineRoomSetup from "../../components/game/OnlineRoomSetup";
import OnlineRoomExample from "../../components/game/OnlineRoomExample";
import CustomAlert from "../../components/game/CustomAlert";
import roomService from "../../services/roomService";
import { playCorrectSound, playWrongSound, playWinSound } from "../../hooks/useGameSounds";
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

function NumberRecallTiles({ onBack, initialRoomCode }) {
  // Game flow states
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'online'
  const [gameStarted, setGameStarted] = useState(false);
  
  // Setup states
  const [difficulty, setDifficulty] = useState('medium');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  
  // Online multiplayer states
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  
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
  
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // Auto-join room from URL
  useEffect(() => {
    if (initialRoomCode && !gameMode && !isInRoom) {
      setGameMode('online');
      setIsOnlineMode(true);
      setRoomCode(initialRoomCode.toUpperCase().trim());
    }
  }, [initialRoomCode, gameMode, isInRoom]);

  // ===== ONLINE GAME HANDLERS =====
  
  const handleGameStart = useCallback((payload) => {
    const { 
      players: gamePlayers, 
      tilePositions: gameTilePositions, 
      requiredSequence: gameSequence,
      difficulty: gameDifficulty,
      numPlayers: gamePlayerCount
    } = payload;
    
    console.log('🎮 handleGameStart - Applying authoritative state:', payload);
    
    setPlayerNames(gamePlayers);
    setPlayerCount(gamePlayerCount);
    setTilePositions(gameTilePositions);
    setRequiredSequence(gameSequence);
    setDifficulty(gameDifficulty);
    setCurrentExpectedIndex(0);
    setRevealedTiles([]);
    setCurrentPlayerIndex(0);
    setWrongTile(null);
    setCorrectTile(null);
    setIsResetting(false);
    setGameOver(false);
    setWinner(null);
    setWaitingForPlayers(false);
    setGameStarted(true);
    
    // Find my player index
    const myIndex = gamePlayers.indexOf(roomService.playerName);
    setMyPlayerIndex(myIndex);
    console.log('🎮 My player index:', myIndex, 'My name:', roomService.playerName);
  }, []);

  const handleRemoteTileClick = useCallback((payload) => {
    const { 
      gridIndex, 
      isCorrect, 
      currentExpectedIndex: newExpectedIndex,
      revealedTiles: newRevealedTiles,
      currentPlayerIndex: newPlayerIndex,
      isGameOver,
      winner: gameWinner
    } = payload;
    
    console.log('🎯 Applying remote tile click:', payload);
    
    if (isCorrect) {
      playCorrectSound();
      setCorrectTile(gridIndex);
      setRevealedTiles(newRevealedTiles);
      
      setTimeout(() => setCorrectTile(null), 300);
      
      if (isGameOver) {
        playWinSound();
        setWinner(gameWinner);
        setGameOver(true);
      } else {
        setCurrentExpectedIndex(newExpectedIndex);
      }
    } else {
      playWrongSound();
      setWrongTile(gridIndex);
      setIsResetting(true);
      
      setTimeout(() => {
        setWrongTile(null);
        setCurrentPlayerIndex(newPlayerIndex);
        setRevealedTiles([]);
        setCurrentExpectedIndex(0);
        setIsResetting(false);
      }, 800);
    }
  }, []);

  const handleRemoteRestart = useCallback((payload) => {
    const { 
      tilePositions: newTilePositions, 
      requiredSequence: newSequence 
    } = payload;
    
    console.log('🔄 Applying remote restart:', payload);
    
    setTilePositions(newTilePositions);
    setRequiredSequence(newSequence);
    setCurrentExpectedIndex(0);
    setRevealedTiles([]);
    setCurrentPlayerIndex(0);
    setWrongTile(null);
    setCorrectTile(null);
    setIsResetting(false);
    setGameOver(false);
    setWinner(null);
  }, []);

  // Setup online game listeners
  useEffect(() => {
    if (!isOnlineMode || !isInRoom) return;

    console.log('🎮 Setting up online game listeners');

    const handleError = (errorMessage) => {
      console.log('❌ Error received:', errorMessage);
      setAlertMessage(errorMessage);
    };

    const handlePlayerJoined = (data) => {
      console.log('👋 Player joined:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      const allPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...allPlayers]);
      
      if (gameStarted) {
        setAlertMessage(`${data.playerName || 'A player'} disconnected!`);
      }
    };

    const handleGameAction = (data) => {
      console.log('🎮 Game action received:', data.action, data.payload);
      
      switch (data.action) {
        case 'game-start':
          handleGameStart(data.payload);
          break;
          
        case 'tile-click':
          handleRemoteTileClick(data.payload);
          break;
          
        case 'restart-game':
          handleRemoteRestart(data.payload);
          break;
      }
    };

    // Register callbacks
    roomService.on('onError', handleError);
    roomService.on('onPlayerJoined', handlePlayerJoined);
    roomService.on('onPlayerLeft', handlePlayerLeft);
    roomService.on('onGameAction', handleGameAction);

    // Get initial player list
    const initialPlayers = roomService.getConnectedPlayers();
    setConnectedPlayers([...initialPlayers]);

    return () => {
      console.log('🧹 Cleaning up online game listeners');
    };
  }, [isOnlineMode, isInRoom, handleGameStart, handleRemoteTileClick, handleRemoteRestart, gameStarted]);

  // ===== ROOM MANAGEMENT =====
  
  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    
    try {
      roomService.playerName = playerName.trim();
      const { roomCode: newRoomCode } = await roomService.createRoom();
      setRoomCode(newRoomCode);
      setIsHost(true);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      
      const initialPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...initialPlayers]);
    } catch (error) {
      console.error('Failed to create room:', error);
      setAlertMessage(error.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    
    try {
      roomService.playerName = playerName.trim();
      await roomService.joinRoom(roomCode);
      setIsHost(false);
      setIsInRoom(true);
      setWaitingForPlayers(true);
      
      const initialPlayers = roomService.getConnectedPlayers();
      setConnectedPlayers([...initialPlayers]);
    } catch (error) {
      console.error('Failed to join room:', error);
      setAlertMessage(error.message || 'Failed to join room');
    }
  };

  const handleStartOnlineGame = () => {
    if (!isHost || connectedPlayers.length < 2) return;
    
    // Generate game state
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const gameTilePositions = shuffleArray(numbers);
    const gameSequence = settings.useRandomSequence ? shuffleArray(numbers) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const gamePlayers = connectedPlayers.map(p => p.playerName);
    
    const payload = {
      players: gamePlayers,
      tilePositions: gameTilePositions,
      requiredSequence: gameSequence,
      difficulty,
      numPlayers: connectedPlayers.length
    };
    
    // Apply locally
    handleGameStart(payload);
    
    // Broadcast to all players
    roomService.sendGameAction('game-start', payload);
  };

  const leaveRoom = () => {
    roomService.leaveRoom();
    setIsInRoom(false);
    setIsHost(false);
    setWaitingForPlayers(false);
    setConnectedPlayers([]);
    setGameStarted(false);
    setGameMode(null);
    setIsOnlineMode(false);
  };
  
  // Initialize game - tile positions stay fixed for entire game
  const initializeGame = useCallback(() => {
    // Create tile positions: shuffle numbers 1-9 (stays same for whole game)
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
  }, [settings.useRandomSequence]);
  
  // Start the game (local mode)
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
    if (isResetting || gameOver) return;
    
    // In online mode, only current player can click
    if (isOnlineMode && myPlayerIndex !== currentPlayerIndex) {
      setAlertMessage("Wait for your turn!");
      return;
    }
    
    const clickedNumber = tilePositions[gridIndex];
    const expectedNumber = requiredSequence[currentExpectedIndex];
    
    if (clickedNumber === expectedNumber) {
      // Correct click! Mark tile as found
      playCorrectSound();
      setCorrectTile(gridIndex);
      const newRevealedTiles = [...revealedTiles, gridIndex];
      setRevealedTiles(newRevealedTiles);
      
      setTimeout(() => setCorrectTile(null), 300);
      
      const nextIndex = currentExpectedIndex + 1;
      
      if (nextIndex >= 9) {
        // Player completed the sequence - they win!
        playWinSound();
        setWinner(currentPlayerIndex);
        setGameOver(true);
        
        if (isOnlineMode) {
          roomService.sendGameAction('tile-click', {
            gridIndex,
            isCorrect: true,
            currentExpectedIndex: nextIndex,
            revealedTiles: newRevealedTiles,
            currentPlayerIndex,
            isGameOver: true,
            winner: currentPlayerIndex
          });
        }
      } else {
        setCurrentExpectedIndex(nextIndex);
        
        if (isOnlineMode) {
          roomService.sendGameAction('tile-click', {
            gridIndex,
            isCorrect: true,
            currentExpectedIndex: nextIndex,
            revealedTiles: newRevealedTiles,
            currentPlayerIndex,
            isGameOver: false,
            winner: null
          });
        }
      }
    } else {
      // Wrong click - end turn
      playWrongSound();
      setWrongTile(gridIndex);
      setIsResetting(true);
      
      const nextPlayer = (currentPlayerIndex + 1) % playerCount;
      
      if (isOnlineMode) {
        roomService.sendGameAction('tile-click', {
          gridIndex,
          isCorrect: false,
          currentExpectedIndex: 0,
          revealedTiles: [],
          currentPlayerIndex: nextPlayer,
          isGameOver: false,
          winner: null
        });
      }
      
      setTimeout(() => {
        setWrongTile(null);
        setCurrentPlayerIndex(nextPlayer);
        setRevealedTiles([]);
        setCurrentExpectedIndex(0);
        setIsResetting(false);
      }, 800);
    }
  };
  
  // Restart game
  const restartGame = () => {
    if (isOnlineMode) {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const newTilePositions = shuffleArray(numbers);
      const newSequence = settings.useRandomSequence ? shuffleArray(numbers) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      const payload = {
        tilePositions: newTilePositions,
        requiredSequence: newSequence
      };
      
      handleRemoteRestart(payload);
      roomService.sendGameAction('restart-game', payload);
    } else {
      setCurrentPlayerIndex(0);
      initializeGame();
    }
  };
  
  // Go back to setup
  const goToSetup = () => {
    if (isOnlineMode) {
      leaveRoom();
    } else {
      setGameStarted(false);
      setGameOver(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (gameStarted) {
      goToSetup();
    } else if (isInRoom) {
      leaveRoom();
    } else if (gameMode) {
      setGameMode(null);
      setIsOnlineMode(false);
    } else if (onBack) {
      onBack();
    }
  };
  
  // Get current player name
  const getCurrentPlayerName = () => playerNames[currentPlayerIndex];
  
  // Check if it's my turn
  const isMyTurn = !isOnlineMode || myPlayerIndex === currentPlayerIndex;
  
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
            onSelectOnline={() => {
              setGameMode('online');
              setIsOnlineMode(true);
            }}
            localLabel="Local Play"
            onlineLabel="Play Online"
            maxPlayers="Up to 4 players"
          />
        </div>
      </div>
    );
  }
  
  // ========== RENDER: Online Room Setup ==========
  if (gameMode === 'online' && !isInRoom) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🔢 Number Recall</h1>
          <p className={styles.setupSubtitle}>Online Multiplayer</p>
          
          <OnlineRoomSetup
            playerName={playerName}
            setPlayerName={setPlayerName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            gameName="Number Recall"
          />
          
          <div className={styles.startBtnWrapper} style={{ marginTop: '1rem' }}>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                setGameMode(null);
                setIsOnlineMode(false);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
        
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </div>
    );
  }
  
  // ========== RENDER: Waiting Room ==========
  if (gameMode === 'online' && isInRoom && waitingForPlayers && !gameStarted) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🔢 Number Recall</h1>
          
          {/* Difficulty Selection (Host only) */}
          {isHost && (
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
          )}
          
          <OnlineRoomExample
            roomCode={roomCode}
            connectedPlayers={connectedPlayers}
            maxPlayers={4}
            minPlayers={2}
            isHost={isHost}
            onStartGame={handleStartOnlineGame}
            gameUrl={`${window.location.origin}/number-recall?room=${roomCode}`}
          />
          
          <div className={styles.startBtnWrapper} style={{ marginTop: '1rem' }}>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={leaveRoom}
            >
              Leave Room
            </button>
          </div>
        </div>
        
        {alertMessage && (
          <CustomAlert
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}
      </div>
    );
  }
  
  // ========== RENDER: Local Setup Screen ==========
  if (gameMode === 'local' && !gameStarted) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🔢 Number Recall</h1>
          <p className={styles.setupSubtitle}>Local Multiplayer</p>
          
          {/* Player Count */}
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
            <div className={styles.currentPlayerName}>
              {getCurrentPlayerName()}
              {isOnlineMode && isMyTurn && <span className={styles.yourTurn}> (You)</span>}
            </div>
          </div>
        </div>
        
        {/* Player Cards */}
        <div className={styles.playerInfo}>
          {playerNames.slice(0, playerCount).map((name, idx) => (
            <div 
              key={idx}
              className={`${styles.playerCard} ${currentPlayerIndex === idx ? styles.active : ''} ${isOnlineMode && myPlayerIndex === idx ? styles.me : ''}`}
            >
              <span className={styles.playerName}>{name}</span>
              {currentPlayerIndex === idx && (
                <span className={styles.turnIndicator}>Playing</span>
              )}
              {isOnlineMode && myPlayerIndex === idx && (
                <span className={styles.meIndicator}>You</span>
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
          <div className={styles.statusText}>
            {isResetting
              ? 'Wrong! Switching turns...'
              : `🎯 Find: ${requiredSequence[currentExpectedIndex]} (${currentExpectedIndex + 1}/9)`
            }
          </div>
          {isOnlineMode && !isMyTurn && !isResetting && (
            <div className={styles.waitingText}>Waiting for {getCurrentPlayerName()}...</div>
          )}
        </div>
        
        {/* Tile Grid */}
        <div className={styles.gridWrapper}>
          <div className={styles.tileGrid}>
            {tilePositions.map((number, gridIndex) => {
              const isRevealed = revealedTiles.includes(gridIndex);
              const isWrong = wrongTile === gridIndex;
              const isCorrect = correctTile === gridIndex;
              const isAlreadyFound = isRevealed && !isCorrect;
              
              return (
                <button
                  key={gridIndex}
                  className={`
                    ${styles.tile}
                    ${isRevealed ? styles.revealed : ''}
                    ${isWrong ? styles.wrong : ''}
                    ${isCorrect ? styles.correct : ''}
                    ${isAlreadyFound ? styles.found : ''}
                    ${isResetting ? styles.disabled : ''}
                    ${isOnlineMode && !isMyTurn ? styles.notMyTurn : ''}
                  `}
                  onClick={() => handleTileClick(gridIndex)}
                  disabled={isResetting || gameOver || isRevealed || (isOnlineMode && !isMyTurn)}
                >
                  {isRevealed ? number : '?'}
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
                {isOnlineMode ? 'Leave Room' : 'Change Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {alertMessage && (
        <CustomAlert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}

export default NumberRecallTiles;
