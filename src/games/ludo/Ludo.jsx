import { useState, useEffect } from "react";
import LudoBoard from "./LudoBoard";
import styles from "./Ludo.module.css";

// Player colors and starting positions
const COLORS = ["red", "green", "yellow", "blue"];

// Safe positions on the board (star positions safe for all players)
const SAFE_POSITIONS = [8, 21, 34, 47]; // Star positions on the main path

// Starting positions for each color on the main 52-position circular path
const START_POSITIONS = {
  red: 1,      // Red's starting position (exits at position 0)
  green: 14,   // Green's starting position (exits at position 13)
  yellow: 27,  // Yellow's starting position (exits at position 26)
  blue: 40     // Blue's starting position (exits at position 39)
};

// Home stretch entry positions on the main path
const HOME_ENTRY = {
  red: 50,     // Red enters home stretch from position 50
  green: 11,   // Green enters home stretch from position 11
  yellow: 24,  // Yellow enters home stretch from position 24
  blue: 37     // Blue enters home stretch from position 37
};

// Total positions: 52 (circular) + 5 (home stretch) per player
const MAIN_PATH_LENGTH = 52;
const HOME_STRETCH_LENGTH = 5;
const WINNING_POSITION = 57; // Position when token reaches the center

// Simple Alert Component
function SimpleAlert({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'fadeSlideIn 0.3s ease'
    }}>
      {message}
    </div>
  );
}

// Simple Button Component
function GameButton({ children, onClick, variant = 'primary', size = 'medium', disabled = false, style = {} }) {
  const baseStyles = {
    padding: size === 'large' ? '1rem 2.5rem' : size === 'small' ? '0.5rem 1rem' : '0.75rem 1.5rem',
    fontSize: size === 'large' ? '1.2rem' : size === 'small' ? '0.9rem' : '1rem',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(109, 40, 217, 0.4)'
    },
    secondary: {
      background: 'rgba(255,255,255,0.1)',
      color: '#E2E8F0',
      border: '2px solid rgba(139, 92, 246, 0.4)'
    },
    success: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
    }
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ ...baseStyles, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
}

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
  const [selectedToken, setSelectedToken] = useState(null);
  const [movableTokens, setMovableTokens] = useState([]);
  const [showRules, setShowRules] = useState(false);

  const gameRules = [
    "Roll 6 to move a token out of home",
    "Move tokens clockwise around the board",
    "Land on opponent's token to send them home (unless on safe spot)",
    "Safe spots (star positions) protect your tokens",
    "Roll 6 to get an extra turn",
    "First player to get all 4 tokens home wins!"
  ];

  // Initialize tokens for each player
  useEffect(() => {
    if (gameStarted) {
      const initialTokens = {};
      for (let i = 0; i < numPlayers; i++) {
        const color = COLORS[i];
        initialTokens[color] = [
          { id: 0, position: -1, isHome: true, isSafe: false },
          { id: 1, position: -1, isHome: true, isSafe: false },
          { id: 2, position: -1, isHome: true, isSafe: false },
          { id: 3, position: -1, isHome: true, isSafe: false },
        ];
      }
      setTokens(initialTokens);
    }
  }, [gameStarted, numPlayers]);

  function resetGameState() {
    setNumPlayers(2);
    setPlayerNames(["", ""]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setCanRoll(true);
    setTokens({});
    setWinner(null);
    setSelectedToken(null);
    setMovableTokens([]);
  }

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
    const validNames = playerNames.filter(name => name.trim() !== "");
    if (validNames.length < numPlayers) {
      setAlertMessage("Please enter all player names!");
      return;
    }
    setPlayerNames(validNames);
    setGameStarted(true);
  }

  function rollDice() {
    if (!canRoll) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setCanRoll(false);

    const currentColor = COLORS[currentPlayer];
    const playerTokens = tokens[currentColor];
    const movable = [];

    playerTokens.forEach((token, idx) => {
      if (token.isHome && roll === 6) {
        movable.push(idx);
      } else if (!token.isHome && token.position < WINNING_POSITION) {
        const newPos = token.position + roll;
        if (newPos <= WINNING_POSITION) {
          movable.push(idx);
        }
      }
    });

    setMovableTokens(movable);

    if (movable.length === 0) {
      setTimeout(() => {
        nextTurn(false);
      }, 1500);
    } else if (movable.length === 1) {
      setTimeout(() => {
        moveToken(movable[0], roll);
      }, 500);
    }
  }

  function moveToken(tokenIndex, steps = diceValue) {
    const currentColor = COLORS[currentPlayer];
    const newTokens = { ...tokens };
    const token = { ...newTokens[currentColor][tokenIndex] };

    if (token.isHome && steps === 6) {
      token.isHome = false;
      token.position = START_POSITIONS[currentColor];
      token.isSafe = true;
    } else if (!token.isHome) {
      const newPosition = token.position + steps;
      
      if (newPosition <= WINNING_POSITION) {
        token.position = newPosition;
        token.isSafe = SAFE_POSITIONS.includes(token.position % MAIN_PATH_LENGTH);

        if (!token.isSafe && newPosition < MAIN_PATH_LENGTH) {
          Object.keys(newTokens).forEach(color => {
            if (color !== currentColor) {
              newTokens[color] = newTokens[color].map(t => {
                if (!t.isHome && t.position === token.position && !t.isSafe) {
                  return { ...t, position: -1, isHome: true, isSafe: false };
                }
                return t;
              });
            }
          });
        }
      }
    }

    newTokens[currentColor][tokenIndex] = token;
    setTokens(newTokens);
    setSelectedToken(null);
    setMovableTokens([]);

    const allTokensHome = newTokens[currentColor].every(t => t.position === WINNING_POSITION);
    if (allTokensHome) {
      const winnerName = playerNames[currentPlayer];
      setWinner(winnerName);
      return;
    }

    nextTurn(steps === 6);
  }

  function nextTurn(extraTurn) {
    if (!extraTurn) {
      const nextPlayerIndex = (currentPlayer + 1) % numPlayers;
      setCurrentPlayer(nextPlayerIndex);
    }
    setDiceValue(null);
    setCanRoll(true);
    setSelectedToken(null);
    setMovableTokens([]);
  }

  function resetGame() {
    setGameStarted(false);
    resetGameState();
  }

  // Setup Screen
  if (!gameStarted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
        padding: '2rem'
      }}>
        {alertMessage && (
          <SimpleAlert 
            message={alertMessage} 
            onClose={() => setAlertMessage(null)} 
          />
        )}
        
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ 
            textAlign: 'center', 
            color: '#fff', 
            fontSize: '2.5rem', 
            marginBottom: '2rem',
            textShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}>
            🎲 Ludo King
          </h1>
          
          <div className={styles.setupContainer}>
            <p className={styles.setupDescription}>
              Classic Ludo game for 2-4 players. Roll the dice and race your tokens to the finish!
            </p>

            {/* Rules */}
            <div className={styles.rulesContentGame}>
              <strong>Quick Rules:</strong> Roll 6 to start • Land on opponents to capture • Safe spots protect you • Get all tokens home to win!
            </div>

            {/* Number of Players */}
            <div className={styles.playerCountSection}>
              <label className={styles.label}>Number of Players:</label>
              <div className={styles.playerCountButtons}>
                {[2, 3, 4].map((count) => (
                  <GameButton
                    key={count}
                    onClick={() => handlePlayerCountChange(count)}
                    variant={numPlayers === count ? 'primary' : 'secondary'}
                  >
                    {count} Players
                  </GameButton>
                ))}
              </div>
            </div>

            {/* Player Names Input Section */}
            <div className={styles.playersSection}>
              <label className={styles.label}>Enter Player Names:</label>
              <div className={styles.playersInputs}>
                {Array.from({ length: numPlayers }).map((_, index) => (
                  <div key={index} className={styles.playerInputRow}>
                    <span 
                      className={styles.colorDot} 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <label className={styles.playerLabel}>
                      Player {index + 1}:
                    </label>
                    <input
                      type="text"
                      value={playerNames[index] || ""}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`Enter name for ${COLORS[index]} player`}
                      className={styles.input}
                      maxLength={15}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <GameButton onClick={startGame} variant="primary" size="large">
                🎮 Start Game
              </GameButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  const currentColor = COLORS[currentPlayer];
  const currentPlayerName = playerNames[currentPlayer];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
      padding: '1rem'
    }}>
      {alertMessage && (
        <SimpleAlert 
          message={alertMessage} 
          onClose={() => setAlertMessage(null)} 
        />
      )}
      
      <div className={styles.gameContainer}>
        {/* Game Info Bar */}
        <div className={styles.gameInfo}>
          <div className={styles.currentPlayerInfo}>
            <span 
              className={styles.playerDot} 
              style={{ backgroundColor: currentColor }}
            />
            <span className={styles.currentPlayerName}>{currentPlayerName}'s Turn</span>
          </div>

          <div className={styles.gameInstructions}>
            {canRoll ? (
              <span className={styles.instructionText}>🎲 Click the dice in {currentPlayerName}'s home area to roll!</span>
            ) : diceValue ? (
              <span className={styles.instructionText}>You rolled a {diceValue}! {movableTokens.length > 0 ? '👆 Click a glowing token to move' : '⏳ No moves available'}</span>
            ) : (
              <span className={styles.instructionText}>⏳ Moving...</span>
            )}
          </div>

          <GameButton
            onClick={() => setShowRules(!showRules)}
            variant="secondary"
            size="small"
          >
            📖 Rules
          </GameButton>
        </div>

        {showRules && (
          <div className={styles.rulesContentGame}>
            <strong>Quick Rules:</strong> Roll 6 to start • Land on opponents to capture • Safe spots protect you • Get all tokens home to win!
          </div>
        )}

        {/* Ludo Board with integrated dice */}
        <LudoBoard
          tokens={tokens}
          numPlayers={numPlayers}
          selectedToken={selectedToken}
          movableTokens={movableTokens}
          currentPlayer={currentPlayer}
          diceValue={diceValue}
          canRoll={canRoll}
          onRollDice={rollDice}
          onTokenClick={(tokenIndex) => {
            if (movableTokens.includes(tokenIndex) && !winner) {
              moveToken(tokenIndex);
            }
          }}
        />

        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          <h3 className={styles.scoreboardTitle}>🏆 Players</h3>
          <div className={styles.playersList}>
            {playerNames.map((name, index) => {
              const color = COLORS[index];
              const tokensAtHome = tokens[color]?.filter(t => t.position === WINNING_POSITION).length || 0;
              return (
                <div 
                  key={index} 
                  className={`${styles.playerScore} ${
                    index === currentPlayer ? styles.activePlayer : ""
                  }`}
                >
                  <span 
                    className={styles.scoreDot} 
                    style={{ backgroundColor: color }}
                  />
                  <span className={styles.playerScoreName}>{name}</span>
                  <span className={styles.tokensHome}>{tokensAtHome}/4 🏠</span>
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
              <div className={styles.winnerSubtext}>
                Congratulations! All tokens made it home!
              </div>
              <GameButton onClick={resetGame} variant="success" size="large">
                🔄 Play Again
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ludo;
