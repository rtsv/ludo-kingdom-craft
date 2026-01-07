import { useState, useEffect } from "react";
import LudoBoard, { COLORS } from "./LudoBoard";
import styles from "./Ludo.module.css";

// Safe positions on the board (star positions)
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Starting positions for each color on the main 52-position circular path
const START_POSITIONS = {
  blue: 0,
  red: 13,
  yellow: 39,
  green: 26
};

// Home stretch entry positions (one position before entering home stretch)
const HOME_ENTRY = {
  blue: 51,   // Blue enters home stretch after position 51
  red: 12,    // Red enters home stretch after position 12
  yellow: 38, // Yellow enters home stretch after position 38
  green: 25   // Green enters home stretch after position 25
};

// Total positions: 52 (circular) + 6 (home stretch) per player
const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 6;
const WINNING_POSITION = 57; // Position when token reaches center

function Ludo() {
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [canRoll, setCanRoll] = useState(true);
  const [tokens, setTokens] = useState({});
  const [winner, setWinner] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [movableTokens, setMovableTokens] = useState([]);

  // Get active colors based on number of players
  const getActiveColors = () => {
    // 2 players: Blue vs Green (opposite corners)
    // 3 players: Blue, Red, Green
    // 4 players: All
    if (numPlayers === 2) return ["blue", "green"];
    if (numPlayers === 3) return ["blue", "red", "green"];
    return ["blue", "red", "yellow", "green"];
  };

  // Initialize tokens for each player
  useEffect(() => {
    if (gameStarted) {
      const activeColors = getActiveColors();
      const initialTokens = {};
      
      activeColors.forEach(color => {
        initialTokens[color] = [
          { id: 0, position: -1, isHome: true, isSafe: false, isFinished: false },
          { id: 1, position: -1, isHome: true, isSafe: false, isFinished: false },
          { id: 2, position: -1, isHome: true, isSafe: false, isFinished: false },
          { id: 3, position: -1, isHome: true, isSafe: false, isFinished: false },
        ];
      });
      
      setTokens(initialTokens);
    }
  }, [gameStarted, numPlayers]);

  function handlePlayerCountChange(count) {
    setNumPlayers(count);
    const names = Array(count).fill("").map((_, i) => 
      i < playerNames.length ? playerNames[i] : ""
    );
    setPlayerNames(names);
  }

  function handlePlayerNameChange(index, value) {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  }

  function startGame() {
    const validNames = playerNames.map((name, i) => 
      name.trim() || `Player ${i + 1}`
    );
    setPlayerNames(validNames);
    setGameStarted(true);
    setCurrentPlayer(0);
    setWinner(null);
    setDiceValue(null);
    setCanRoll(true);
  }

  function rollDice() {
    if (!canRoll) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setCanRoll(false);

    const activeColors = getActiveColors();
    const currentColor = activeColors[currentPlayer];
    const playerTokens = tokens[currentColor];
    
    if (!playerTokens) {
      nextTurn(false);
      return;
    }

    const movable = [];

    playerTokens.forEach((token, idx) => {
      if (token.isFinished) return; // Skip finished tokens
      
      if (token.isHome && roll === 6) {
        // Can move out of home with a 6
        movable.push(idx);
      } else if (!token.isHome && !token.isFinished) {
        // Calculate if move is valid
        const currentPos = token.position;
        const stepsToWin = WINNING_POSITION - currentPos;
        
        if (roll <= stepsToWin) {
          movable.push(idx);
        }
      }
    });

    setMovableTokens(movable);

    if (movable.length === 0) {
      // No valid moves, pass turn after delay
      setTimeout(() => {
        nextTurn(false);
      }, 1500);
    } else if (movable.length === 1) {
      // Auto-move single movable token
      setTimeout(() => {
        moveToken(movable[0], roll);
      }, 500);
    }
  }

  function moveToken(tokenIndex, steps = diceValue) {
    const activeColors = getActiveColors();
    const currentColor = activeColors[currentPlayer];
    const newTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
    const token = newTokens[currentColor][tokenIndex];
    
    let capturedOpponent = false;

    if (token.isHome && steps === 6) {
      // Move out of home to start position
      token.isHome = false;
      token.position = 1; // First position on the path (relative to color)
      token.isSafe = true; // Start position is always safe
      
      // Check for capture at start position
      const absoluteStart = START_POSITIONS[currentColor];
      capturedOpponent = checkAndCapture(newTokens, currentColor, absoluteStart);
      
    } else if (!token.isHome) {
      const newPosition = token.position + steps;
      
      if (newPosition >= WINNING_POSITION) {
        // Token finished!
        token.position = WINNING_POSITION;
        token.isFinished = true;
        token.isSafe = true;
      } else if (newPosition > MAIN_PATH_LENGTH) {
        // In home stretch (positions 53-57)
        token.position = newPosition;
        token.isSafe = true; // Home stretch is always safe
      } else {
        // Normal move on main path
        token.position = newPosition;
        
        // Calculate absolute position on the board
        const startPos = START_POSITIONS[currentColor];
        const absolutePos = (startPos + newPosition - 1) % MAIN_PATH_LENGTH;
        
        // Check if on safe spot
        token.isSafe = SAFE_POSITIONS.includes(absolutePos);
        
        // Check for capture
        if (!token.isSafe) {
          capturedOpponent = checkAndCapture(newTokens, currentColor, absolutePos);
        }
      }
    }

    newTokens[currentColor][tokenIndex] = token;
    setTokens(newTokens);
    setMovableTokens([]);

    // Check for winner
    const allFinished = newTokens[currentColor].every(t => t.isFinished);
    if (allFinished) {
      setWinner(playerNames[currentPlayer]);
      return;
    }

    // Extra turn for rolling 6 or capturing
    const extraTurn = steps === 6 || capturedOpponent;
    nextTurn(!extraTurn);
  }

  function checkAndCapture(tokens, currentColor, absolutePosition) {
    let captured = false;
    
    Object.keys(tokens).forEach(color => {
      if (color === currentColor) return;
      
      tokens[color].forEach((token, idx) => {
        if (token.isHome || token.isFinished || token.isSafe) return;
        
        // Calculate absolute position for this token
        const tokenStartPos = START_POSITIONS[color];
        const tokenAbsolutePos = (tokenStartPos + token.position - 1) % MAIN_PATH_LENGTH;
        
        if (tokenAbsolutePos === absolutePosition) {
          // Capture! Send back to home
          tokens[color][idx] = {
            ...token,
            position: -1,
            isHome: true,
            isSafe: false
          };
          captured = true;
        }
      });
    });
    
    return captured;
  }

  function nextTurn(skip) {
    if (!skip) {
      const activeColors = getActiveColors();
      let nextPlayerIndex = (currentPlayer + 1) % activeColors.length;
      setCurrentPlayer(nextPlayerIndex);
    }
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
  }

  function resetGame() {
    setGameStarted(false);
    setNumPlayers(2);
    setPlayerNames(["", ""]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setCanRoll(true);
    setTokens({});
    setWinner(null);
    setMovableTokens([]);
  }

  // Get color config for current display
  const activeColors = getActiveColors();
  const currentColor = activeColors[currentPlayer];

  // Setup Screen
  if (!gameStarted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1565C0 100%)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className={styles.setupContainer}>
          <h1 className={styles.setupTitle}>🎲 Ludo King</h1>
          <p className={styles.setupSubtitle}>Classic board game for 2-4 players</p>
          
          <div className={styles.rulesBox}>
            <strong>Quick Rules: </strong>
            <span>Roll 6 to start • Land on opponents to capture • Stars are safe • Get all 4 tokens home to win!</span>
          </div>

          <div className={styles.playerCountSection}>
            <label className={styles.label}>Number of Players</label>
            <div className={styles.playerCountButtons}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountChange(count)}
                  className={`${styles.btn} ${numPlayers === count ? styles.btnActive : styles.btnSecondary}`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          <div className={styles.playersSection}>
            <label className={styles.label}>Player Names</label>
            <div className={styles.playersInputs}>
              {Array.from({ length: numPlayers }).map((_, index) => {
                const colors = getActiveColors();
                const color = colors[index];
                const colorMap = {
                  blue: '#2196F3',
                  red: '#F44336',
                  yellow: '#FFEB3B',
                  green: '#4CAF50'
                };
                
                return (
                  <div key={index} className={styles.playerInputRow}>
                    <span 
                      className={styles.colorDot} 
                      style={{ backgroundColor: colorMap[color] }}
                    />
                    <label className={styles.playerLabel}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}:
                    </label>
                    <input
                      type="text"
                      value={playerNames[index] || ""}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className={styles.input}
                      maxLength={12}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={startGame} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
              🎮 Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1565C0 100%)',
      padding: '0.5rem'
    }}>
      {/* Game Header */}
      <div className={styles.gameHeader} style={{ maxWidth: '600px', margin: '0 auto 0.5rem' }}>
        <div className={styles.turnIndicator}>
          <div 
            className={styles.turnDot}
            style={{ 
              backgroundColor: currentColor === 'blue' ? '#2196F3' : 
                              currentColor === 'red' ? '#F44336' : 
                              currentColor === 'yellow' ? '#FFEB3B' : '#4CAF50'
            }}
          />
          <span className={styles.turnText}>{playerNames[currentPlayer]}'s Turn</span>
        </div>
        <p className={styles.instruction}>
          {canRoll 
            ? '🎲 Click the dice to roll!' 
            : diceValue 
              ? `Rolled ${diceValue}! ${movableTokens.length > 0 ? 'Click a glowing token to move' : 'No moves available'}`
              : 'Moving...'
          }
        </p>
      </div>

      {/* Game Board */}
      <LudoBoard
        tokens={tokens}
        numPlayers={numPlayers}
        currentPlayer={currentPlayer}
        movableTokens={movableTokens}
        onTokenClick={(tokenIndex) => {
          if (movableTokens.includes(tokenIndex) && !winner) {
            moveToken(tokenIndex);
          }
        }}
        diceValue={diceValue}
        canRoll={canRoll}
        onRollDice={rollDice}
        playerNames={playerNames}
        playerColors={activeColors}
      />

      {/* Scoreboard */}
      <div className={styles.scoreboard} style={{ maxWidth: '600px', margin: '0.5rem auto 0' }}>
        <h3 className={styles.scoreboardTitle}>🏆 Progress</h3>
        <div className={styles.playersList}>
          {activeColors.map((color, index) => {
            const colorMap = {
              blue: '#2196F3',
              red: '#F44336',
              yellow: '#FFEB3B',
              green: '#4CAF50'
            };
            const finished = tokens[color]?.filter(t => t.isFinished).length || 0;
            
            return (
              <div 
                key={color} 
                className={`${styles.playerScore} ${index === currentPlayer ? styles.activePlayer : ''}`}
              >
                <span className={styles.scoreDot} style={{ backgroundColor: colorMap[color] }} />
                <span className={styles.playerScoreName}>{playerNames[index]}</span>
                <span className={styles.tokensHome}>{finished}/4 🏠</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className={styles.winnerOverlay}>
          <div className={styles.winnerCard}>
            <div className={styles.winnerText}>🎉 {winner} Wins! 🎉</div>
            <p className={styles.winnerSubtext}>All tokens reached home!</p>
            <button 
              onClick={resetGame} 
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
              style={{ background: '#1a1a1a', color: '#FFD700' }}
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ludo;
