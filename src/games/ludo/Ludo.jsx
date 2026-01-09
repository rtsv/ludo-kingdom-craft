import { useState, useEffect, useCallback } from "react";
import LudoBoard from "./LudoBoard";
import styles from "./Ludo.module.css";

// Safe positions on the board (star positions) - absolute positions
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Starting positions for each color on the main 52-position circular path
const START_POSITIONS = {
  blue: 0,
  red: 13,
  green: 26,
  yellow: 39
};

// Home stretch entry - when a token passes this position, it enters home stretch
// These are the last positions on main path before entering home stretch
const HOME_ENTRY = {
  blue: 51,   // Blue enters home stretch after position 51
  red: 12,    // Red enters home stretch after position 12
  green: 25,  // Green enters home stretch after position 25
  yellow: 38  // Yellow enters home stretch after position 38
};

// Total positions: 52 (circular) + 6 (home stretch) per player
const MAIN_PATH_LENGTH = 52;

function Ludo() {
  const [gameStarted, setGameStarted] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [canRoll, setCanRoll] = useState(true);
  const [tokens, setTokens] = useState({});
  const [winner, setWinner] = useState(null);
  const [movableTokens, setMovableTokens] = useState([]);
  const [playerRankings, setPlayerRankings] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Get active colors based on number of players
  // 2 players: Blue vs Green (diagonal opposites like Ludo King)
  // 3 players: Blue, Red, Green
  // 4 players: All four colors
  const getActiveColors = useCallback(() => {
    if (numPlayers === 2) return ["blue", "green"];
    if (numPlayers === 3) return ["blue", "red", "green"];
    return ["blue", "red", "green", "yellow"];
  }, [numPlayers]);

  const activeColors = getActiveColors();
  const currentColor = activeColors[currentPlayerIndex];

  // Initialize tokens for each player
  useEffect(() => {
    if (gameStarted) {
      const colors = getActiveColors();
      const initialTokens = {};
      
      colors.forEach(color => {
        initialTokens[color] = [
          { id: 0, position: -1, isHome: true, isFinished: false },
          { id: 1, position: -1, isHome: true, isFinished: false },
          { id: 2, position: -1, isHome: true, isFinished: false },
          { id: 3, position: -1, isHome: true, isFinished: false },
        ];
      });
      
      setTokens(initialTokens);
    }
  }, [gameStarted, getActiveColors]);

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
    setCurrentPlayerIndex(0);
    setWinner(null);
    setDiceValue(null);
    setCanRoll(true);
    setPlayerRankings([]);
    setGameOver(false);
  }

  // Calculate absolute position on main path for a token
  function getAbsolutePosition(color, relativePosition) {
    if (relativePosition < 0 || relativePosition >= MAIN_PATH_LENGTH) return -1;
    const startPos = START_POSITIONS[color];
    return (startPos + relativePosition) % MAIN_PATH_LENGTH;
  }

  // Check if a position is safe (star or starting position)
  function isSafePosition(absolutePosition) {
    return SAFE_POSITIONS.includes(absolutePosition);
  }

  function rollDice() {
    if (!canRoll || winner || gameOver) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceValue(roll);
    setCanRoll(false);

    const playerTokens = tokens[currentColor];
    
    // Check if current player has already finished all tokens
    const hasFinished = playerTokens && playerTokens.every(t => t.isFinished);
    if (!playerTokens || hasFinished) {
      setTimeout(() => {
        nextTurn();
      }, 1000);
      return;
    }

    const movable = [];

    playerTokens.forEach((token, idx) => {
      if (token.isFinished) return;
      
      if (token.isHome) {
        // Can only move out of home with a 6
        if (roll === 6) {
          movable.push(idx);
        }
      } else {
        // Token is on the board
        const currentPos = token.position;
        
        // Check if in home stretch (positions 52-57)
        if (currentPos >= MAIN_PATH_LENGTH) {
          const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
          const newHomeStretchPos = homeStretchPos + roll;
          // Can only move if exact or less than finish
          if (newHomeStretchPos <= 5) {
            movable.push(idx);
          }
        } else {
          // On main path - check if move is valid
          const currentAbsolute = getAbsolutePosition(currentColor, currentPos);
          const homeEntry = HOME_ENTRY[currentColor];
          
          // Check if path would cross into home stretch
          let stepsToHomeEntry;
          if (currentAbsolute <= homeEntry) {
            stepsToHomeEntry = homeEntry - currentAbsolute;
          } else {
            stepsToHomeEntry = MAIN_PATH_LENGTH - currentAbsolute + homeEntry;
          }
          
          if (currentPos + roll > MAIN_PATH_LENGTH - 1 + 5) {
            // Would overshoot finish - can't move
          } else {
            // Valid move
            movable.push(idx);
          }
        }
      }
    });

    setMovableTokens(movable);

    if (movable.length === 0) {
      setTimeout(() => {
        nextTurn();
      }, 1500);
    } else if (movable.length === 1) {
      setTimeout(() => {
        moveToken(movable[0], roll);
      }, 500);
    }
  }

  function moveToken(tokenIndex, steps = diceValue) {
    if (!steps) return;
    
    const newTokens = JSON.parse(JSON.stringify(tokens));
    const token = newTokens[currentColor][tokenIndex];
    
    let capturedOpponent = false;
    let tokenFinished = false;

    if (token.isHome && steps === 6) {
      // Move out of home to starting position (position 0 relative to this color)
      token.isHome = false;
      token.position = 0;
      
      // Check for capture at start position
      const absoluteStart = START_POSITIONS[currentColor];
      capturedOpponent = checkAndCapture(newTokens, currentColor, absoluteStart);
      
    } else if (!token.isHome && !token.isFinished) {
      const currentPos = token.position;
      const newPos = currentPos + steps;
      
      if (currentPos >= MAIN_PATH_LENGTH) {
        // Already in home stretch
        const homeStretchPos = currentPos - MAIN_PATH_LENGTH;
        const newHomeStretchPos = homeStretchPos + steps;
        
        if (newHomeStretchPos >= 5) {
          // Reached home!
          token.position = MAIN_PATH_LENGTH + 5;
          token.isFinished = true;
          tokenFinished = true;
        } else {
          token.position = MAIN_PATH_LENGTH + newHomeStretchPos;
        }
      } else {
        // On main path - need to check if entering home stretch
        const homeEntry = HOME_ENTRY[currentColor];
        
        // Calculate absolute positions for current and new positions
        const currentAbsolutePos = getAbsolutePosition(currentColor, currentPos);
        
        // Check if the token will cross or land on its home entry point
        let willEnterHomeStretch = false;
        let stepsAfterHomeEntry = 0;
        
        for (let step = 1; step <= steps; step++) {
          const testPos = currentPos + step;
          const testAbsolutePos = getAbsolutePosition(currentColor, testPos);
          
          // Check if we've reached the home entry position
          if (testAbsolutePos === homeEntry) {
            willEnterHomeStretch = true;
            stepsAfterHomeEntry = steps - step;
            break;
          }
        }
        
        if (willEnterHomeStretch && stepsAfterHomeEntry >= 0) {
          // Token enters home stretch
          const homeStretchPos = stepsAfterHomeEntry;
          if (homeStretchPos >= 5) {
            // Exactly reached or passed home
            token.position = MAIN_PATH_LENGTH + 5;
            token.isFinished = true;
            tokenFinished = true;
          } else {
            token.position = MAIN_PATH_LENGTH + homeStretchPos;
          }
        } else {
          // Still on main path
          token.position = newPos;
          
          // Calculate absolute position for capture check
          const absolutePos = getAbsolutePosition(currentColor, newPos);
          
          // Check for capture if not on safe spot
          if (!isSafePosition(absolutePos)) {
            capturedOpponent = checkAndCapture(newTokens, currentColor, absolutePos);
          }
        }
      }
    }

    newTokens[currentColor][tokenIndex] = token;
    setTokens(newTokens);
    setMovableTokens([]);

    // Check for winner
    const allFinished = newTokens[currentColor].every(t => t.isFinished);
    if (allFinished) {
      const newRankings = [...playerRankings, playerNames[currentPlayerIndex]];
      setPlayerRankings(newRankings);

      if (newRankings.length === activeColors.length - 1) {
        // Game over when only one player remains
        const remainingPlayerIndex = activeColors.findIndex(
          (_, index) => !newRankings.includes(playerNames[index])
        );
        const finalRankings = [...newRankings, playerNames[remainingPlayerIndex]];
        setPlayerRankings(finalRankings);
        setGameOver(true);
        return;
      }

      nextTurn();
      return;
    }

    // Player gets another turn if:
    // 1. They rolled a 6, OR
    // 2. A token just finished (reached home), OR
    // 3. They captured an opponent
    // Otherwise, pass turn to next player
    setTimeout(() => {
      if (steps === 6 || tokenFinished || capturedOpponent) {
        // Player gets another turn
        setDiceValue(null);
        setCanRoll(true);
      } else {
        nextTurn();
      }
    }, 300);
  }

  function checkAndCapture(tokensState, attackerColor, absolutePosition) {
    let captured = false;
    
    Object.keys(tokensState).forEach(color => {
      if (color === attackerColor) return;
      
      tokensState[color].forEach((token, idx) => {
        if (token.isHome || token.isFinished) return;
        if (token.position >= MAIN_PATH_LENGTH) return; // In home stretch, safe
        
        // Calculate absolute position for this opponent token
        const tokenAbsolutePos = getAbsolutePosition(color, token.position);
        
        // Check if on safe position
        if (isSafePosition(tokenAbsolutePos)) return;
        
        if (tokenAbsolutePos === absolutePosition) {
          // Capture! Send back to home
          tokensState[color][idx] = {
            ...token,
            position: -1,
            isHome: true
          };
          captured = true;
        }
      });
    });
    
    return captured;
  }

  function nextTurn() {
    const nextIdx = (currentPlayerIndex + 1) % activeColors.length;
    setCurrentPlayerIndex(nextIdx);
    setDiceValue(null);
    setCanRoll(true);
    setMovableTokens([]);
  }

  function resetGame() {
    setGameStarted(false);
    setNumPlayers(2);
    setPlayerNames(["", ""]);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setCanRoll(true);
    setTokens({});
    setWinner(null);
    setMovableTokens([]);
    setPlayerRankings([]);
    setGameOver(false);
  }

  // Player Setup Screen
  if (!gameStarted) {
    // Color labels for display
    const getColorLabel = (index) => {
      const colors = getActiveColors();
      const colorMap = {
        blue: '🔵 Blue',
        red: '🔴 Red',
        green: '🟢 Green',
        yellow: '🟡 Yellow'
      };
      return colorMap[colors[index]] || `Player ${index + 1}`;
    };

    return (
      <div className={styles.setupPage}>
        <div className={styles.setupContainer}>
          <h1 className={styles.title}>🎲 Ludo King</h1>
          <p className={styles.setupDescription}>
            Select number of players and enter names to begin!
          </p>

          <div className={styles.playerCountSection}>
            <label className={styles.label}>Number of Players</label>
            <div className={styles.playerCountButtons}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountChange(count)}
                  className={`${styles.countButton} ${numPlayers === count ? styles.countButtonActive : ''}`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          <div className={styles.playerNamesSection}>
            {playerNames.map((name, index) => (
              <div key={index} className={styles.playerNameRow}>
                <span className={styles.colorLabel}>{getColorLabel(index)}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  className={styles.nameInput}
                />
              </div>
            ))}
          </div>

          <button onClick={startGame} className={styles.startButton}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className={styles.gamePage}>
      <LudoBoard
        tokens={tokens}
        activeColors={activeColors}
        currentPlayerIndex={currentPlayerIndex}
        currentColor={currentColor}
        movableTokens={movableTokens}
        onTokenClick={(tokenIndex) => {
          if (movableTokens.includes(tokenIndex) && !winner && !gameOver) {
            moveToken(tokenIndex);
          }
        }}
        diceValue={diceValue}
        canRoll={canRoll}
        onRollDice={rollDice}
        playerNames={playerNames}
      />

      {/* Winner Modal */}
      {gameOver && (
        <div className={styles.winnerOverlay}>
          <div className={styles.winnerCard}>
            <div className={styles.winnerText}>🏆 Game Over! 🏆</div>
            <p className={styles.winnerSubtext}>Final Rankings:</p>
            <ol className={styles.rankingsList}>
              {playerRankings.map((player, index) => (
                <li key={index} className={styles.rankingsItem}>
                  {index + 1}. {player}
                </li>
              ))}
            </ol>
            <button 
              onClick={resetGame} 
              className={styles.startButton}
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
