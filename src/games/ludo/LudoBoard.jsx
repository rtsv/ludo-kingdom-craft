import { useEffect, useState } from "react";
import styles from "./Ludo.module.css";

// Ludo King Color Positions:
// Blue = Top-Left, Red = Top-Right, Yellow = Bottom-Left, Green = Bottom-Right
const COLORS = ["blue", "red", "yellow", "green"];

// Board is 15x15 grid
const CELL_SIZE = 40;
const BOARD_SIZE = 15;

// Color definitions matching Ludo King
const COLOR_CONFIG = {
  blue: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1565C0',
    homeArea: '#2196F3',
    stretch: '#BBDEFB'
  },
  red: {
    main: '#F44336',
    light: '#EF5350',
    dark: '#C62828',
    homeArea: '#F44336',
    stretch: '#FFCDD2'
  },
  yellow: {
    main: '#FFEB3B',
    light: '#FFF176',
    dark: '#F9A825',
    homeArea: '#FFEB3B',
    stretch: '#FFF9C4'
  },
  green: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#2E7D32',
    homeArea: '#4CAF50',
    stretch: '#C8E6C9'
  }
};

// Convert grid position to pixel coordinates
const g2p = (x, y) => ({ x: x * CELL_SIZE, y: y * CELL_SIZE });

// The main path - 52 cells going around the board clockwise
// Starting from Blue's entry (position 0) at left column going down
const createMainPath = () => {
  const path = [];
  
  // From Blue entry going DOWN left column (positions 0-5)
  for (let i = 6; i <= 11; i++) path.push(g2p(0, i)); // 0-5
  
  // Turn to go RIGHT along bottom-left (positions 6-11)
  path.push(g2p(0, 12));
  path.push(g2p(0, 13));
  path.push(g2p(1, 14));
  path.push(g2p(2, 14));
  path.push(g2p(3, 14));
  path.push(g2p(4, 14));
  path.push(g2p(5, 14));
  
  // Yellow entry and path UP (positions 12-18)
  path.push(g2p(6, 14));
  for (let i = 13; i >= 8; i--) path.push(g2p(6, i));
  
  // Cross to center right column (positions 19-25)
  for (let i = 8; i <= 14; i++) path.push(g2p(i, 6));
  
  // Green entry and path DOWN (positions 26-32)
  path.push(g2p(14, 6));
  for (let i = 7; i <= 12; i++) path.push(g2p(14, i));
  
  // Turn to go LEFT along bottom-right (positions 33-38)
  path.push(g2p(14, 13));
  path.push(g2p(14, 14));
  path.push(g2p(13, 14));
  path.push(g2p(12, 14));
  path.push(g2p(11, 14));
  path.push(g2p(10, 14));
  path.push(g2p(9, 14));
  
  // Red entry and path UP (positions 39-45)
  path.push(g2p(8, 14));
  for (let i = 13; i >= 8; i--) path.push(g2p(8, i));
  
  // Cross to center top (positions 46-51)
  for (let i = 6; i >= 0; i--) path.push(g2p(i, 8));
  
  return path;
};

// Corrected main path for standard Ludo board
const MAIN_PATH = (() => {
  const path = [];
  
  // Blue's path starts from (1, 6) going up, then clockwise
  // Position 0: Blue start
  path.push(g2p(1, 6)); // 0 - Blue start
  path.push(g2p(2, 6)); // 1
  path.push(g2p(3, 6)); // 2
  path.push(g2p(4, 6)); // 3
  path.push(g2p(5, 6)); // 4
  path.push(g2p(6, 5)); // 5
  path.push(g2p(6, 4)); // 6
  path.push(g2p(6, 3)); // 7
  path.push(g2p(6, 2)); // 8 - Safe spot
  path.push(g2p(6, 1)); // 9
  path.push(g2p(6, 0)); // 10
  path.push(g2p(7, 0)); // 11
  path.push(g2p(8, 0)); // 12
  
  // Red's section
  path.push(g2p(8, 1)); // 13 - Red start
  path.push(g2p(8, 2)); // 14
  path.push(g2p(8, 3)); // 15
  path.push(g2p(8, 4)); // 16
  path.push(g2p(8, 5)); // 17
  path.push(g2p(9, 6)); // 18
  path.push(g2p(10, 6)); // 19
  path.push(g2p(11, 6)); // 20
  path.push(g2p(12, 6)); // 21 - Safe spot
  path.push(g2p(13, 6)); // 22
  path.push(g2p(14, 6)); // 23
  path.push(g2p(14, 7)); // 24
  path.push(g2p(14, 8)); // 25
  
  // Green's section  
  path.push(g2p(13, 8)); // 26 - Green start
  path.push(g2p(12, 8)); // 27
  path.push(g2p(11, 8)); // 28
  path.push(g2p(10, 8)); // 29
  path.push(g2p(9, 8)); // 30
  path.push(g2p(8, 9)); // 31
  path.push(g2p(8, 10)); // 32
  path.push(g2p(8, 11)); // 33
  path.push(g2p(8, 12)); // 34 - Safe spot
  path.push(g2p(8, 13)); // 35
  path.push(g2p(8, 14)); // 36
  path.push(g2p(7, 14)); // 37
  path.push(g2p(6, 14)); // 38
  
  // Yellow's section
  path.push(g2p(6, 13)); // 39 - Yellow start
  path.push(g2p(6, 12)); // 40
  path.push(g2p(6, 11)); // 41
  path.push(g2p(6, 10)); // 42
  path.push(g2p(6, 9)); // 43
  path.push(g2p(5, 8)); // 44
  path.push(g2p(4, 8)); // 45
  path.push(g2p(3, 8)); // 46
  path.push(g2p(2, 8)); // 47 - Safe spot
  path.push(g2p(1, 8)); // 48
  path.push(g2p(0, 8)); // 49
  path.push(g2p(0, 7)); // 50
  path.push(g2p(0, 6)); // 51 - Back to before Blue start
  
  return path;
})();

// Home bases - 4 token spots per player (matching Ludo King positions)
const HOME_BASES = {
  blue: [g2p(1.5, 1.5), g2p(4, 1.5), g2p(1.5, 4), g2p(4, 4)],
  red: [g2p(10, 1.5), g2p(12.5, 1.5), g2p(10, 4), g2p(12.5, 4)],
  yellow: [g2p(1.5, 10), g2p(4, 10), g2p(1.5, 12.5), g2p(4, 12.5)],
  green: [g2p(10, 10), g2p(12.5, 10), g2p(10, 12.5), g2p(12.5, 12.5)]
};

// Starting positions on main path for each color
const START_POS = { blue: 0, red: 13, green: 26, yellow: 39 };

// Home stretch paths (6 cells leading to center)
const HOME_STRETCH = {
  blue: [g2p(1, 7), g2p(2, 7), g2p(3, 7), g2p(4, 7), g2p(5, 7), g2p(6, 7)],
  red: [g2p(7, 1), g2p(7, 2), g2p(7, 3), g2p(7, 4), g2p(7, 5), g2p(7, 6)],
  green: [g2p(13, 7), g2p(12, 7), g2p(11, 7), g2p(10, 7), g2p(9, 7), g2p(8, 7)],
  yellow: [g2p(7, 13), g2p(7, 12), g2p(7, 11), g2p(7, 10), g2p(7, 9), g2p(7, 8)]
};

// Safe spots (star positions) - indices on main path
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Start positions that are also safe
const START_SAFE = [0, 13, 26, 39];

// Token component - Ludo King style pin/pawn shape
const Token = ({ x, y, color, isMovable, onClick, tokenId }) => {
  const config = COLOR_CONFIG[color];
  const size = CELL_SIZE * 0.85;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  
  return (
    <g 
      className={isMovable ? styles.movableToken : ''} 
      onClick={isMovable ? onClick : undefined}
      style={{ cursor: isMovable ? 'pointer' : 'default' }}
    >
      {/* Movable glow effect */}
      {isMovable && (
        <>
          <circle cx={cx} cy={cy} r={size * 0.6} fill="none" stroke="#FFD700" strokeWidth="3" className={styles.tokenGlow} />
          <circle cx={cx} cy={cy} r={size * 0.7} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" className={styles.tokenGlow2} />
        </>
      )}
      
      {/* Shadow */}
      <ellipse cx={cx + 2} cy={cy + size * 0.35} rx={size * 0.35} ry={size * 0.15} fill="rgba(0,0,0,0.3)" />
      
      {/* Base ring (darker) */}
      <ellipse cx={cx} cy={cy + size * 0.2} rx={size * 0.4} ry={size * 0.18} fill={config.dark} />
      <ellipse cx={cx} cy={cy + size * 0.15} rx={size * 0.35} ry={size * 0.15} fill={config.dark} />
      
      {/* Main body (gradient effect) */}
      <circle cx={cx} cy={cy - size * 0.05} r={size * 0.4} fill={config.main} />
      
      {/* Top highlight */}
      <circle cx={cx} cy={cy - size * 0.05} r={size * 0.4} fill="url(#tokenShine)" />
      
      {/* Inner ring */}
      <circle cx={cx} cy={cy - size * 0.05} r={size * 0.25} fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
      
      {/* Top pin point */}
      <ellipse cx={cx} cy={cy - size * 0.35} rx={size * 0.15} ry={size * 0.1} fill={config.light} />
    </g>
  );
};

// Dice component
const Dice = ({ value, isActive, isRolling, onClick, playerColor }) => {
  const size = 50;
  const dotSize = 6;
  const config = COLOR_CONFIG[playerColor] || { main: '#fff', dark: '#ccc' };
  
  const dotPositions = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
  };

  const dots = dotPositions[value] || dotPositions[1];

  return (
    <div 
      className={`${styles.dice} ${isActive ? styles.diceActive : styles.diceInactive} ${isRolling ? styles.diceRolling : ''}`}
      onClick={isActive && !isRolling ? onClick : undefined}
      style={{ 
        '--dice-color': config.main,
        '--dice-dark': config.dark
      }}
    >
      <div className={styles.diceFace}>
        {dots.map((pos, i) => (
          <div 
            key={i} 
            className={styles.diceDot}
            style={{
              left: `${pos[0] * 100}%`,
              top: `${pos[1] * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

function LudoBoard({ 
  tokens, 
  numPlayers, 
  currentPlayer, 
  movableTokens, 
  onTokenClick, 
  diceValue, 
  canRoll, 
  onRollDice,
  playerNames,
  playerColors 
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState(1);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayDice(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        if (diceValue) setDisplayDice(diceValue);
      }, 600);
      
      return () => clearInterval(interval);
    }
  }, [isRolling, diceValue]);

  useEffect(() => {
    if (diceValue) {
      setDisplayDice(diceValue);
    }
  }, [diceValue]);

  const handleDiceClick = () => {
    if (canRoll && !isRolling) {
      setIsRolling(true);
      setTimeout(() => {
        onRollDice();
      }, 600);
    }
  };

  // Calculate token position
  const getTokenPosition = (color, token) => {
    if (token.isHome || token.position === -1) {
      return HOME_BASES[color][token.id];
    }
    
    if (token.position >= 57) {
      // Won - at center
      const offset = { blue: -8, red: 8, green: 8, yellow: -8 };
      return { x: 7 * CELL_SIZE + (offset[color] || 0), y: 7 * CELL_SIZE + (offset[color] || 0) };
    }
    
    // In home stretch (positions 52-56)
    if (token.position >= 52 && token.position < 57) {
      const idx = token.position - 52;
      return HOME_STRETCH[color][idx];
    }
    
    // On main path
    const startPos = START_POS[color];
    const absolutePos = (startPos + token.position) % 52;
    return MAIN_PATH[absolutePos];
  };

  const boardPixels = BOARD_SIZE * CELL_SIZE;
  const currentColor = playerColors ? playerColors[currentPlayer] : COLORS[currentPlayer];

  // Render a star for safe spots
  const renderStar = (x, y, size = 14) => (
    <polygon
      points={`
        ${x},${y - size}
        ${x + size * 0.22},${y - size * 0.3}
        ${x + size},${y - size * 0.3}
        ${x + size * 0.35},${y + size * 0.1}
        ${x + size * 0.6},${y + size}
        ${x},${y + size * 0.4}
        ${x - size * 0.6},${y + size}
        ${x - size * 0.35},${y + size * 0.1}
        ${x - size},${y - size * 0.3}
        ${x - size * 0.22},${y - size * 0.3}
      `}
      fill="#9E9E9E"
      stroke="#757575"
      strokeWidth="1"
    />
  );

  return (
    <div className={styles.gameBoard}>
      {/* Player Panels */}
      <div className={styles.playerPanels}>
        {/* Blue Panel - Top Left */}
        <div className={`${styles.playerPanel} ${styles.panelBlue} ${currentPlayer === 0 ? styles.panelActive : ''}`}>
          <div className={styles.panelInfo}>
            <div className={styles.panelAvatar} style={{ backgroundColor: COLOR_CONFIG.blue.main }}>
              {playerNames?.[0]?.[0] || 'B'}
            </div>
            <span className={styles.panelName}>{playerNames?.[0] || 'Blue'}</span>
          </div>
          {currentPlayer === 0 && (
            <Dice 
              value={displayDice} 
              isActive={canRoll} 
              isRolling={isRolling}
              onClick={handleDiceClick}
              playerColor="blue"
            />
          )}
        </div>

        {/* Red Panel - Top Right */}
        <div className={`${styles.playerPanel} ${styles.panelRed} ${currentPlayer === 1 ? styles.panelActive : ''}`}>
          <div className={styles.panelInfo}>
            <div className={styles.panelAvatar} style={{ backgroundColor: COLOR_CONFIG.red.main }}>
              {playerNames?.[1]?.[0] || 'R'}
            </div>
            <span className={styles.panelName}>{playerNames?.[1] || 'Red'}</span>
          </div>
          {currentPlayer === 1 && (
            <Dice 
              value={displayDice} 
              isActive={canRoll} 
              isRolling={isRolling}
              onClick={handleDiceClick}
              playerColor="red"
            />
          )}
        </div>

        {/* Yellow Panel - Bottom Left */}
        {numPlayers >= 3 && (
          <div className={`${styles.playerPanel} ${styles.panelYellow} ${currentPlayer === 2 ? styles.panelActive : ''}`}>
            <div className={styles.panelInfo}>
              <div className={styles.panelAvatar} style={{ backgroundColor: COLOR_CONFIG.yellow.main }}>
                {playerNames?.[2]?.[0] || 'Y'}
              </div>
              <span className={styles.panelName}>{playerNames?.[2] || 'Yellow'}</span>
            </div>
            {currentPlayer === 2 && (
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                playerColor="yellow"
              />
            )}
          </div>
        )}

        {/* Green Panel - Bottom Right */}
        {numPlayers >= 4 && (
          <div className={`${styles.playerPanel} ${styles.panelGreen} ${currentPlayer === 3 ? styles.panelActive : ''}`}>
            <div className={styles.panelInfo}>
              <div className={styles.panelAvatar} style={{ backgroundColor: COLOR_CONFIG.green.main }}>
                {playerNames?.[3]?.[0] || 'G'}
              </div>
              <span className={styles.panelName}>{playerNames?.[3] || 'Green'}</span>
            </div>
            {currentPlayer === 3 && (
              <Dice 
                value={displayDice} 
                isActive={canRoll} 
                isRolling={isRolling}
                onClick={handleDiceClick}
                playerColor="green"
              />
            )}
          </div>
        )}
      </div>

      {/* Main Board */}
      <div className={styles.boardWrapper}>
        <svg 
          className={styles.ludoBoard}
          viewBox={`0 0 ${boardPixels} ${boardPixels}`}
        >
          <defs>
            <radialGradient id="tokenShine" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="white" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Board Background */}
          <rect width={boardPixels} height={boardPixels} fill="#ECEFF1" />

          {/* === HOME AREAS === */}
          
          {/* Blue Home - Top Left */}
          <rect x={0} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
            fill={COLOR_CONFIG.blue.homeArea} stroke="#1565C0" strokeWidth="3" />
          <rect x={CELL_SIZE*0.6} y={CELL_SIZE*0.6} width={4.8*CELL_SIZE} height={4.8*CELL_SIZE} 
            fill="#FAFAFA" rx="8" />
          {HOME_BASES.blue.map((pos, i) => (
            <g key={`blue-base-${i}`}>
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.42} 
                fill={COLOR_CONFIG.blue.main} stroke="#1565C0" strokeWidth="2" />
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.28} 
                fill="none" stroke="#BBDEFB" strokeWidth="2" />
            </g>
          ))}
          
          {/* Red Home - Top Right */}
          <rect x={9*CELL_SIZE} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
            fill={COLOR_CONFIG.red.homeArea} stroke="#C62828" strokeWidth="3" />
          <rect x={9.6*CELL_SIZE} y={CELL_SIZE*0.6} width={4.8*CELL_SIZE} height={4.8*CELL_SIZE} 
            fill="#FAFAFA" rx="8" />
          {HOME_BASES.red.map((pos, i) => (
            <g key={`red-base-${i}`}>
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.42} 
                fill={COLOR_CONFIG.red.main} stroke="#C62828" strokeWidth="2" />
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.28} 
                fill="none" stroke="#FFCDD2" strokeWidth="2" />
            </g>
          ))}
          
          {/* Yellow Home - Bottom Left */}
          <rect x={0} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
            fill={COLOR_CONFIG.yellow.homeArea} stroke="#F9A825" strokeWidth="3" />
          <rect x={CELL_SIZE*0.6} y={9.6*CELL_SIZE} width={4.8*CELL_SIZE} height={4.8*CELL_SIZE} 
            fill="#FAFAFA" rx="8" />
          {HOME_BASES.yellow.map((pos, i) => (
            <g key={`yellow-base-${i}`}>
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.42} 
                fill={COLOR_CONFIG.yellow.main} stroke="#F9A825" strokeWidth="2" />
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.28} 
                fill="none" stroke="#FFF9C4" strokeWidth="2" />
            </g>
          ))}
          
          {/* Green Home - Bottom Right */}
          <rect x={9*CELL_SIZE} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
            fill={COLOR_CONFIG.green.homeArea} stroke="#2E7D32" strokeWidth="3" />
          <rect x={9.6*CELL_SIZE} y={9.6*CELL_SIZE} width={4.8*CELL_SIZE} height={4.8*CELL_SIZE} 
            fill="#FAFAFA" rx="8" />
          {HOME_BASES.green.map((pos, i) => (
            <g key={`green-base-${i}`}>
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.42} 
                fill={COLOR_CONFIG.green.main} stroke="#2E7D32" strokeWidth="2" />
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.28} 
                fill="none" stroke="#C8E6C9" strokeWidth="2" />
            </g>
          ))}

          {/* === PATH CELLS === */}
          
          {/* Left column (3 cols x 6 rows) */}
          {[0, 1, 2].map(col => 
            [6, 7, 8].map(row => (
              <rect key={`path-l-${col}-${row}`} 
                x={col * CELL_SIZE} y={row * CELL_SIZE}
                width={CELL_SIZE} height={CELL_SIZE}
                fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
            ))
          )}
          
          {/* Right column (3 cols x 6 rows) */}
          {[12, 13, 14].map(col => 
            [6, 7, 8].map(row => (
              <rect key={`path-r-${col}-${row}`} 
                x={col * CELL_SIZE} y={row * CELL_SIZE}
                width={CELL_SIZE} height={CELL_SIZE}
                fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
            ))
          )}
          
          {/* Top row (6 cols x 3 rows) */}
          {[6, 7, 8].map(col => 
            [0, 1, 2].map(row => (
              <rect key={`path-t-${col}-${row}`} 
                x={col * CELL_SIZE} y={row * CELL_SIZE}
                width={CELL_SIZE} height={CELL_SIZE}
                fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
            ))
          )}
          
          {/* Bottom row (6 cols x 3 rows) */}
          {[6, 7, 8].map(col => 
            [12, 13, 14].map(row => (
              <rect key={`path-b-${col}-${row}`} 
                x={col * CELL_SIZE} y={row * CELL_SIZE}
                width={CELL_SIZE} height={CELL_SIZE}
                fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
            ))
          )}
          
          {/* Center 3x3 */}
          {[6, 7, 8].map(col => 
            [6, 7, 8].map(row => (
              <rect key={`path-c-${col}-${row}`} 
                x={col * CELL_SIZE} y={row * CELL_SIZE}
                width={CELL_SIZE} height={CELL_SIZE}
                fill="#FAFAFA" stroke="#BDBDBD" strokeWidth="1" />
            ))
          )}

          {/* === HOME STRETCH COLORED PATHS === */}
          
          {/* Blue stretch (row 7, cols 1-6) */}
          {HOME_STRETCH.blue.map((pos, i) => (
            <rect key={`blue-str-${i}`} x={pos.x} y={pos.y}
              width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.blue.stretch} stroke={COLOR_CONFIG.blue.main} strokeWidth="1.5" />
          ))}
          
          {/* Red stretch (col 7, rows 1-6) */}
          {HOME_STRETCH.red.map((pos, i) => (
            <rect key={`red-str-${i}`} x={pos.x} y={pos.y}
              width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.red.stretch} stroke={COLOR_CONFIG.red.main} strokeWidth="1.5" />
          ))}
          
          {/* Green stretch (row 7, cols 8-13) */}
          {HOME_STRETCH.green.map((pos, i) => (
            <rect key={`green-str-${i}`} x={pos.x} y={pos.y}
              width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.green.stretch} stroke={COLOR_CONFIG.green.main} strokeWidth="1.5" />
          ))}
          
          {/* Yellow stretch (col 7, rows 8-13) */}
          {HOME_STRETCH.yellow.map((pos, i) => (
            <rect key={`yellow-str-${i}`} x={pos.x} y={pos.y}
              width={CELL_SIZE} height={CELL_SIZE}
              fill={COLOR_CONFIG.yellow.stretch} stroke={COLOR_CONFIG.yellow.main} strokeWidth="1.5" />
          ))}

          {/* === CENTER TRIANGLES === */}
          <polygon points={`${6*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${6*CELL_SIZE},${9*CELL_SIZE}`}
            fill={COLOR_CONFIG.blue.main} stroke={COLOR_CONFIG.blue.dark} strokeWidth="2" />
          <polygon points={`${6*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${6*CELL_SIZE}`}
            fill={COLOR_CONFIG.red.main} stroke={COLOR_CONFIG.red.dark} strokeWidth="2" />
          <polygon points={`${9*CELL_SIZE},${6*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE}`}
            fill={COLOR_CONFIG.green.main} stroke={COLOR_CONFIG.green.dark} strokeWidth="2" />
          <polygon points={`${6*CELL_SIZE},${9*CELL_SIZE} ${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE}`}
            fill={COLOR_CONFIG.yellow.main} stroke={COLOR_CONFIG.yellow.dark} strokeWidth="2" />

          {/* === SAFE SPOTS (STARS) === */}
          {SAFE_SPOTS.map(idx => {
            const pos = MAIN_PATH[idx];
            if (!pos) return null;
            const cx = pos.x + CELL_SIZE / 2;
            const cy = pos.y + CELL_SIZE / 2;
            return (
              <g key={`star-${idx}`}>
                {renderStar(cx, cy, 12)}
              </g>
            );
          })}

          {/* === START POSITION COLORED CELLS === */}
          {/* Blue start */}
          <rect x={1*CELL_SIZE} y={6*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
            fill={COLOR_CONFIG.blue.stretch} stroke={COLOR_CONFIG.blue.main} strokeWidth="2" />
          <text x={1.5*CELL_SIZE} y={6.6*CELL_SIZE} fontSize="16" fill={COLOR_CONFIG.blue.dark} textAnchor="middle">→</text>
          
          {/* Red start */}
          <rect x={8*CELL_SIZE} y={1*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
            fill={COLOR_CONFIG.red.stretch} stroke={COLOR_CONFIG.red.main} strokeWidth="2" />
          <text x={8.5*CELL_SIZE} y={1.7*CELL_SIZE} fontSize="16" fill={COLOR_CONFIG.red.dark} textAnchor="middle">↓</text>
          
          {/* Green start */}
          <rect x={13*CELL_SIZE} y={8*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
            fill={COLOR_CONFIG.green.stretch} stroke={COLOR_CONFIG.green.main} strokeWidth="2" />
          <text x={13.5*CELL_SIZE} y={8.65*CELL_SIZE} fontSize="16" fill={COLOR_CONFIG.green.dark} textAnchor="middle">←</text>
          
          {/* Yellow start */}
          <rect x={6*CELL_SIZE} y={13*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
            fill={COLOR_CONFIG.yellow.stretch} stroke={COLOR_CONFIG.yellow.main} strokeWidth="2" />
          <text x={6.5*CELL_SIZE} y={13.65*CELL_SIZE} fontSize="16" fill={COLOR_CONFIG.yellow.dark} textAnchor="middle">↑</text>

          {/* === TOKENS === */}
          {tokens && Object.keys(tokens).map(color => 
            tokens[color]?.map((token, idx) => {
              const pos = getTokenPosition(color, token);
              if (!pos) return null;

              const colorIdx = COLORS.indexOf(color);
              const isMovable = movableTokens?.includes(idx) && colorIdx === currentPlayer;

              return (
                <Token
                  key={`token-${color}-${idx}`}
                  x={pos.x}
                  y={pos.y}
                  color={color}
                  tokenId={idx}
                  isMovable={isMovable}
                  onClick={() => onTokenClick(idx)}
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}

export default LudoBoard;
export { COLORS, START_POS, HOME_STRETCH, MAIN_PATH, SAFE_SPOTS };
