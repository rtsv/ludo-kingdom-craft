import { useEffect, useState } from "react";
import styles from "./Ludo.module.css";

const COLORS = ["red", "green", "yellow", "blue"];

// Board is 15x15 grid
const CELL_SIZE = 40;
const BOARD_SIZE = 15;

// Convert grid position to pixel coordinates
const g2p = (x, y) => ({ x: x * CELL_SIZE, y: y * CELL_SIZE });

// The main path - 52 cells going around the board
const createMainPath = () => {
  const path = [];
  
  // Starting from Red's entry point at bottom of left column (position 0)
  // Going UP the left column
  for (let i = 8; i >= 2; i--) path.push(g2p(1, i));
  
  // Turn corner - left arm to top arm
  path.push(g2p(1, 1));
  path.push(g2p(2, 1));
  path.push(g2p(3, 1));
  path.push(g2p(4, 1));
  path.push(g2p(5, 1));
  path.push(g2p(6, 1));
  
  // Blue's entry and path - going RIGHT across top
  path.push(g2p(7, 1)); // Blue start (position 13)
  path.push(g2p(8, 1));
  path.push(g2p(9, 1));
  path.push(g2p(10, 1));
  path.push(g2p(11, 1));
  path.push(g2p(12, 1));
  path.push(g2p(13, 1));
  
  // Turn corner - top arm to right arm
  path.push(g2p(14, 1));
  path.push(g2p(14, 2));
  path.push(g2p(14, 3));
  path.push(g2p(14, 4));
  path.push(g2p(14, 5));
  path.push(g2p(14, 6));
  
  // Green's entry and path - going DOWN the right column
  path.push(g2p(14, 7)); // Green start (position 26)
  path.push(g2p(14, 8));
  path.push(g2p(14, 9));
  path.push(g2p(14, 10));
  path.push(g2p(14, 11));
  path.push(g2p(14, 12));
  path.push(g2p(14, 13));
  
  // Turn corner - right arm to bottom arm
  path.push(g2p(13, 13));
  path.push(g2p(12, 13));
  path.push(g2p(11, 13));
  path.push(g2p(10, 13));
  path.push(g2p(9, 13));
  path.push(g2p(8, 13));
  
  // Yellow's entry and path - going LEFT across bottom
  path.push(g2p(7, 13)); // Yellow start (position 39)
  path.push(g2p(6, 13));
  path.push(g2p(5, 13));
  path.push(g2p(4, 13));
  path.push(g2p(3, 13));
  path.push(g2p(2, 13));
  path.push(g2p(1, 13));
  
  // Complete the loop back to start
  path.push(g2p(1, 12));
  path.push(g2p(1, 11));
  path.push(g2p(1, 10));
  path.push(g2p(1, 9));
  
  return path;
};

const MAIN_PATH = createMainPath();

// Home bases - starting positions for tokens (4 per player)
const HOME_BASES = {
  red: [g2p(2, 10), g2p(4, 10), g2p(2, 12), g2p(4, 12)],
  blue: [g2p(2, 2), g2p(4, 2), g2p(2, 4), g2p(4, 4)],
  green: [g2p(10, 2), g2p(12, 2), g2p(10, 4), g2p(12, 4)],
  yellow: [g2p(10, 10), g2p(12, 10), g2p(10, 12), g2p(12, 12)]
};

// Dice positions for each player's home area
const DICE_POSITIONS = {
  red: { x: 3 * CELL_SIZE, y: 11 * CELL_SIZE },
  blue: { x: 3 * CELL_SIZE, y: 3 * CELL_SIZE },
  green: { x: 11 * CELL_SIZE, y: 3 * CELL_SIZE },
  yellow: { x: 11 * CELL_SIZE, y: 11 * CELL_SIZE }
};

// Starting positions on main path for each color
const START_POS = { red: 0, blue: 13, green: 26, yellow: 39 };

// Home stretch paths (5 cells leading to center)
const HOME_STRETCH = {
  red: [g2p(2, 7), g2p(3, 7), g2p(4, 7), g2p(5, 7), g2p(6, 7)],
  blue: [g2p(7, 2), g2p(7, 3), g2p(7, 4), g2p(7, 5), g2p(7, 6)],
  green: [g2p(13, 7), g2p(12, 7), g2p(11, 7), g2p(10, 7), g2p(9, 7)],
  yellow: [g2p(7, 12), g2p(7, 11), g2p(7, 10), g2p(7, 9), g2p(7, 8)]
};

// Safe spots (star positions)
const SAFE_SPOTS = [8, 21, 34, 47];

// Color definitions for Ludo King style
const COLOR_DEFS = {
  red: {
    main: '#E53935',
    light: '#EF5350',
    dark: '#B71C1C',
    glow: '#FF8A80'
  },
  blue: {
    main: '#1E88E5',
    light: '#42A5F5',
    dark: '#0D47A1',
    glow: '#82B1FF'
  },
  green: {
    main: '#43A047',
    light: '#66BB6A',
    dark: '#1B5E20',
    glow: '#B9F6CA'
  },
  yellow: {
    main: '#FDD835',
    light: '#FFEE58',
    dark: '#F9A825',
    glow: '#FFFF8D'
  }
};

// Dice face SVG patterns
const DiceFace = ({ value, x, y, size, isActive, onClick }) => {
  const dotSize = size * 0.12;
  const padding = size * 0.22;
  
  const dotPositions = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]]
  };

  const dots = dotPositions[value] || dotPositions[1];
  const innerSize = size - padding * 2;

  return (
    <g 
      className={isActive ? styles.activeDice : styles.inactiveDice}
      onClick={isActive ? onClick : undefined}
      style={{ cursor: isActive ? 'pointer' : 'default' }}
    >
      {/* Dice glow effect */}
      {isActive && (
        <>
          <rect
            x={x - size/2 - 8}
            y={y - size/2 - 8}
            width={size + 16}
            height={size + 16}
            rx={12}
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
            className={styles.diceGlow}
          />
          <rect
            x={x - size/2 - 12}
            y={y - size/2 - 12}
            width={size + 24}
            height={size + 24}
            rx={14}
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            opacity="0.5"
            className={styles.diceGlow2}
          />
        </>
      )}
      
      {/* Dice shadow */}
      <rect
        x={x - size/2 + 3}
        y={y - size/2 + 3}
        width={size}
        height={size}
        rx={8}
        fill="rgba(0,0,0,0.3)"
      />
      
      {/* Dice body with gradient */}
      <defs>
        <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F5F5F5" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
        <filter id="diceShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      <rect
        x={x - size/2}
        y={y - size/2}
        width={size}
        height={size}
        rx={8}
        fill="url(#diceGradient)"
        stroke="#BDBDBD"
        strokeWidth="2"
        filter="url(#diceShadow)"
      />
      
      {/* Dice dots */}
      {dots.map((pos, i) => (
        <circle
          key={i}
          cx={x - size/2 + padding + pos[0] * innerSize}
          cy={y - size/2 + padding + pos[1] * innerSize}
          r={dotSize}
          fill="#212121"
        />
      ))}
    </g>
  );
};

function LudoBoard({ tokens, numPlayers, selectedToken, movableTokens, currentPlayer, onTokenClick, diceValue, onRollDice, canRoll }) {
  const [isRolling, setIsRolling] = useState(false);
  const [rollingValue, setRollingValue] = useState(1);

  // Dice rolling animation
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setRollingValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
      }, 600);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isRolling]);

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
    // At home base
    if (token.isHome || token.position === -1) {
      return HOME_BASES[color][token.id];
    }
    
    // Won - at center
    if (token.position === 56) {
      return g2p(7.5, 7.5);
    }
    
    // In home stretch (last 5 cells before winning)
    if (token.position > 50) {
      const idx = token.position - 51;
      return HOME_STRETCH[color][idx];
    }
    
    // On main path
    const startPos = START_POS[color];
    const absolutePos = (startPos + token.position) % 52;
    return MAIN_PATH[absolutePos];
  };

  const boardPixels = BOARD_SIZE * CELL_SIZE;
  const currentColor = COLORS[currentPlayer];
  const dicePos = DICE_POSITIONS[currentColor];
  const displayValue = isRolling ? rollingValue : (diceValue || 1);

  return (
    <div className={styles.ludoBoardWrapper}>
      {/* Decorative corner pieces */}
      <div className={styles.boardCorner + ' ' + styles.cornerTopLeft}></div>
      <div className={styles.boardCorner + ' ' + styles.cornerTopRight}></div>
      <div className={styles.boardCorner + ' ' + styles.cornerBottomLeft}></div>
      <div className={styles.boardCorner + ' ' + styles.cornerBottomRight}></div>
      
      <svg 
        className={styles.ludoBoard}
        viewBox={`0 0 ${boardPixels} ${boardPixels}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Gradient definitions */}
        <defs>
          {/* Board background texture */}
          <pattern id="boardPattern" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="#F5F0E6"/>
            <rect x="0" y="0" width="20" height="20" fill="#F8F4EC" opacity="0.5"/>
            <rect x="20" y="20" width="20" height="20" fill="#F8F4EC" opacity="0.5"/>
          </pattern>
          
          {/* Home area gradients */}
          <linearGradient id="redHomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF5350"/>
            <stop offset="50%" stopColor="#E53935"/>
            <stop offset="100%" stopColor="#C62828"/>
          </linearGradient>
          <linearGradient id="blueHomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#42A5F5"/>
            <stop offset="50%" stopColor="#1E88E5"/>
            <stop offset="100%" stopColor="#1565C0"/>
          </linearGradient>
          <linearGradient id="greenHomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#66BB6A"/>
            <stop offset="50%" stopColor="#43A047"/>
            <stop offset="100%" stopColor="#2E7D32"/>
          </linearGradient>
          <linearGradient id="yellowHomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEE58"/>
            <stop offset="50%" stopColor="#FDD835"/>
            <stop offset="100%" stopColor="#F9A825"/>
          </linearGradient>

          {/* Token gradient template */}
          <radialGradient id="tokenShine" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
            <stop offset="40%" stopColor="white" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>

          {/* Star gradient */}
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="70%" stopColor="#FFA000"/>
            <stop offset="100%" stopColor="#FF6F00"/>
          </radialGradient>

          {/* Cell highlight for path */}
          <linearGradient id="cellHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Board background */}
        <rect width={boardPixels} height={boardPixels} fill="url(#boardPattern)" />
        
        {/* === 4 CORNER HOME AREAS === */}
        
        {/* Red Home - Bottom Left */}
        <rect x={0} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
          fill="url(#redHomeGrad)" stroke="#B71C1C" strokeWidth="3" rx="4" />
        {/* Inner white area */}
        <rect x={CELL_SIZE*0.8} y={9.8*CELL_SIZE} width={4.4*CELL_SIZE} height={4.4*CELL_SIZE} 
          fill="#FAFAFA" stroke="#B71C1C" strokeWidth="2" rx="8" />
        {/* Home base circles */}
        {HOME_BASES.red.map((pos, i) => (
          <g key={`red-home-${i}`}>
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.38} fill="#E53935" stroke="#B71C1C" strokeWidth="2" />
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.28} fill="none" stroke="#FFCDD2" strokeWidth="1.5" strokeDasharray="4,3" />
          </g>
        ))}
        
        {/* Blue Home - Top Left */}
        <rect x={0} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
          fill="url(#blueHomeGrad)" stroke="#0D47A1" strokeWidth="3" rx="4" />
        <rect x={CELL_SIZE*0.8} y={CELL_SIZE*0.8} width={4.4*CELL_SIZE} height={4.4*CELL_SIZE} 
          fill="#FAFAFA" stroke="#0D47A1" strokeWidth="2" rx="8" />
        {HOME_BASES.blue.map((pos, i) => (
          <g key={`blue-home-${i}`}>
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.38} fill="#1E88E5" stroke="#0D47A1" strokeWidth="2" />
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.28} fill="none" stroke="#BBDEFB" strokeWidth="1.5" strokeDasharray="4,3" />
          </g>
        ))}
        
        {/* Green Home - Top Right */}
        <rect x={9*CELL_SIZE} y={0} width={6*CELL_SIZE} height={6*CELL_SIZE} 
          fill="url(#greenHomeGrad)" stroke="#1B5E20" strokeWidth="3" rx="4" />
        <rect x={9.8*CELL_SIZE} y={CELL_SIZE*0.8} width={4.4*CELL_SIZE} height={4.4*CELL_SIZE} 
          fill="#FAFAFA" stroke="#1B5E20" strokeWidth="2" rx="8" />
        {HOME_BASES.green.map((pos, i) => (
          <g key={`green-home-${i}`}>
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.38} fill="#43A047" stroke="#1B5E20" strokeWidth="2" />
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.28} fill="none" stroke="#C8E6C9" strokeWidth="1.5" strokeDasharray="4,3" />
          </g>
        ))}
        
        {/* Yellow Home - Bottom Right */}
        <rect x={9*CELL_SIZE} y={9*CELL_SIZE} width={6*CELL_SIZE} height={6*CELL_SIZE} 
          fill="url(#yellowHomeGrad)" stroke="#F57F17" strokeWidth="3" rx="4" />
        <rect x={9.8*CELL_SIZE} y={9.8*CELL_SIZE} width={4.4*CELL_SIZE} height={4.4*CELL_SIZE} 
          fill="#FAFAFA" stroke="#F57F17" strokeWidth="2" rx="8" />
        {HOME_BASES.yellow.map((pos, i) => (
          <g key={`yellow-home-${i}`}>
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.38} fill="#FDD835" stroke="#F57F17" strokeWidth="2" />
            <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} 
              r={CELL_SIZE*0.28} fill="none" stroke="#FFF9C4" strokeWidth="1.5" strokeDasharray="4,3" />
          </g>
        ))}

        {/* === CROSS-SHAPED MAIN PATH === */}
        
        {/* Path cells with subtle gradient */}
        {/* Left vertical arm */}
        {[0, 1, 2].map(col => 
          [6, 7, 8].map(row => (
            <g key={`left-${col}-${row}`}>
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE} fill="#FFFDE7" stroke="#E0E0E0" strokeWidth="1" />
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE*0.3} fill="url(#cellHighlight)" />
            </g>
          ))
        )}
        
        {/* Right vertical arm */}
        {[12, 13, 14].map(col => 
          [6, 7, 8].map(row => (
            <g key={`right-${col}-${row}`}>
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE} fill="#FFFDE7" stroke="#E0E0E0" strokeWidth="1" />
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE*0.3} fill="url(#cellHighlight)" />
            </g>
          ))
        )}
        
        {/* Top horizontal arm */}
        {[6, 7, 8].map(col => 
          [0, 1, 2].map(row => (
            <g key={`top-${col}-${row}`}>
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE} fill="#FFFDE7" stroke="#E0E0E0" strokeWidth="1" />
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE*0.3} fill="url(#cellHighlight)" />
            </g>
          ))
        )}
        
        {/* Bottom horizontal arm */}
        {[6, 7, 8].map(col => 
          [12, 13, 14].map(row => (
            <g key={`bottom-${col}-${row}`}>
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE} fill="#FFFDE7" stroke="#E0E0E0" strokeWidth="1" />
              <rect x={col*CELL_SIZE} y={row*CELL_SIZE} 
                width={CELL_SIZE} height={CELL_SIZE*0.3} fill="url(#cellHighlight)" />
            </g>
          ))
        )}
        
        {/* Middle 3x3 area */}
        {[6, 7, 8].map(col => 
          [6, 7, 8].map(row => (
            <rect key={`center-${col}-${row}`} x={col*CELL_SIZE} y={row*CELL_SIZE} 
              width={CELL_SIZE} height={CELL_SIZE} fill="#FFFDE7" stroke="#E0E0E0" strokeWidth="1" />
          ))
        )}

        {/* === HOME STRETCH COLORED PATHS === */}
        
        {/* Red path - horizontal from left */}
        {HOME_STRETCH.red.map((pos, i) => (
          <g key={`red-stretch-${i}`}>
            <rect x={pos.x} y={pos.y} 
              width={CELL_SIZE} height={CELL_SIZE} fill="#FFCDD2" stroke="#E53935" strokeWidth="1.5" />
            <polygon 
              points={`${pos.x + CELL_SIZE/2},${pos.y + 4} ${pos.x + CELL_SIZE - 4},${pos.y + CELL_SIZE/2} ${pos.x + CELL_SIZE/2},${pos.y + CELL_SIZE - 4} ${pos.x + 4},${pos.y + CELL_SIZE/2}`}
              fill="#E53935" opacity="0.3"
            />
          </g>
        ))}
        
        {/* Blue path - vertical from top */}
        {HOME_STRETCH.blue.map((pos, i) => (
          <g key={`blue-stretch-${i}`}>
            <rect x={pos.x} y={pos.y} 
              width={CELL_SIZE} height={CELL_SIZE} fill="#BBDEFB" stroke="#1E88E5" strokeWidth="1.5" />
            <polygon 
              points={`${pos.x + CELL_SIZE/2},${pos.y + 4} ${pos.x + CELL_SIZE - 4},${pos.y + CELL_SIZE/2} ${pos.x + CELL_SIZE/2},${pos.y + CELL_SIZE - 4} ${pos.x + 4},${pos.y + CELL_SIZE/2}`}
              fill="#1E88E5" opacity="0.3"
            />
          </g>
        ))}
        
        {/* Green path - horizontal from right */}
        {HOME_STRETCH.green.map((pos, i) => (
          <g key={`green-stretch-${i}`}>
            <rect x={pos.x} y={pos.y} 
              width={CELL_SIZE} height={CELL_SIZE} fill="#C8E6C9" stroke="#43A047" strokeWidth="1.5" />
            <polygon 
              points={`${pos.x + CELL_SIZE/2},${pos.y + 4} ${pos.x + CELL_SIZE - 4},${pos.y + CELL_SIZE/2} ${pos.x + CELL_SIZE/2},${pos.y + CELL_SIZE - 4} ${pos.x + 4},${pos.y + CELL_SIZE/2}`}
              fill="#43A047" opacity="0.3"
            />
          </g>
        ))}
        
        {/* Yellow path - vertical from bottom */}
        {HOME_STRETCH.yellow.map((pos, i) => (
          <g key={`yellow-stretch-${i}`}>
            <rect x={pos.x} y={pos.y} 
              width={CELL_SIZE} height={CELL_SIZE} fill="#FFF9C4" stroke="#FDD835" strokeWidth="1.5" />
            <polygon 
              points={`${pos.x + CELL_SIZE/2},${pos.y + 4} ${pos.x + CELL_SIZE - 4},${pos.y + CELL_SIZE/2} ${pos.x + CELL_SIZE/2},${pos.y + CELL_SIZE - 4} ${pos.x + 4},${pos.y + CELL_SIZE/2}`}
              fill="#FDD835" opacity="0.3"
            />
          </g>
        ))}

        {/* Center winning area - triangles */}
        <g>
          {/* Red triangle */}
          <polygon 
            points={`${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${6*CELL_SIZE},${9*CELL_SIZE} ${6*CELL_SIZE},${6*CELL_SIZE}`}
            fill="url(#redHomeGrad)" stroke="#B71C1C" strokeWidth="2" />
          {/* Blue triangle */}
          <polygon 
            points={`${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${6*CELL_SIZE},${6*CELL_SIZE} ${9*CELL_SIZE},${6*CELL_SIZE}`}
            fill="url(#blueHomeGrad)" stroke="#0D47A1" strokeWidth="2" />
          {/* Green triangle */}
          <polygon 
            points={`${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${6*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE}`}
            fill="url(#greenHomeGrad)" stroke="#1B5E20" strokeWidth="2" />
          {/* Yellow triangle */}
          <polygon 
            points={`${7.5*CELL_SIZE},${7.5*CELL_SIZE} ${9*CELL_SIZE},${9*CELL_SIZE} ${6*CELL_SIZE},${9*CELL_SIZE}`}
            fill="url(#yellowHomeGrad)" stroke="#F57F17" strokeWidth="2" />
        </g>
        
        {/* Center circle with decorative ring */}
        <circle cx={7.5*CELL_SIZE} cy={7.5*CELL_SIZE} r={CELL_SIZE*0.9} 
          fill="#FAFAFA" stroke="#424242" strokeWidth="3" />
        <circle cx={7.5*CELL_SIZE} cy={7.5*CELL_SIZE} r={CELL_SIZE*0.6} 
          fill="none" stroke="#BDBDBD" strokeWidth="2" strokeDasharray="6,4" />
        <circle cx={7.5*CELL_SIZE} cy={7.5*CELL_SIZE} r={CELL_SIZE*0.3} 
          fill="#FFD700" stroke="#FF8F00" strokeWidth="2" />

        {/* === SAFE SPOTS (STARS) with glow === */}
        {SAFE_SPOTS.map(idx => {
          const pos = MAIN_PATH[idx];
          return (
            <g key={`star-${idx}`}>
              {/* Star glow */}
              <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.4}
                fill="url(#starGlow)" opacity="0.4" />
              {/* Star shape */}
              <polygon
                points={`
                  ${pos.x + CELL_SIZE/2},${pos.y + 4}
                  ${pos.x + CELL_SIZE/2 + 6},${pos.y + CELL_SIZE/2 - 4}
                  ${pos.x + CELL_SIZE - 4},${pos.y + CELL_SIZE/2 - 4}
                  ${pos.x + CELL_SIZE/2 + 10},${pos.y + CELL_SIZE/2 + 4}
                  ${pos.x + CELL_SIZE/2 + 6},${pos.y + CELL_SIZE - 4}
                  ${pos.x + CELL_SIZE/2},${pos.y + CELL_SIZE/2 + 8}
                  ${pos.x + CELL_SIZE/2 - 6},${pos.y + CELL_SIZE - 4}
                  ${pos.x + CELL_SIZE/2 - 10},${pos.y + CELL_SIZE/2 + 4}
                  ${pos.x + 4},${pos.y + CELL_SIZE/2 - 4}
                  ${pos.x + CELL_SIZE/2 - 6},${pos.y + CELL_SIZE/2 - 4}
                `}
                fill="#FFD700" stroke="#FF8F00" strokeWidth="1"
              />
            </g>
          );
        })}

        {/* === STARTING POINT COLORED CELLS === */}
        {/* Red start */}
        <rect x={1*CELL_SIZE} y={8*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
          fill="#FFCDD2" stroke="#E53935" strokeWidth="2" />
        <polygon points={`${1.5*CELL_SIZE},${8.2*CELL_SIZE} ${1.2*CELL_SIZE},${8.5*CELL_SIZE} ${1.8*CELL_SIZE},${8.5*CELL_SIZE}`} 
          fill="#E53935" />
          
        {/* Blue start */}
        <rect x={7*CELL_SIZE} y={1*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
          fill="#BBDEFB" stroke="#1E88E5" strokeWidth="2" />
        <polygon points={`${7.5*CELL_SIZE},${1.2*CELL_SIZE} ${7.2*CELL_SIZE},${1.8*CELL_SIZE} ${7.8*CELL_SIZE},${1.8*CELL_SIZE}`} 
          fill="#1E88E5" />
          
        {/* Green start */}
        <rect x={13*CELL_SIZE} y={7*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
          fill="#C8E6C9" stroke="#43A047" strokeWidth="2" />
        <polygon points={`${13.8*CELL_SIZE},${7.5*CELL_SIZE} ${13.2*CELL_SIZE},${7.2*CELL_SIZE} ${13.2*CELL_SIZE},${7.8*CELL_SIZE}`} 
          fill="#43A047" />
          
        {/* Yellow start */}
        <rect x={7*CELL_SIZE} y={13*CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE}
          fill="#FFF9C4" stroke="#FDD835" strokeWidth="2" />
        <polygon points={`${7.5*CELL_SIZE},${13.8*CELL_SIZE} ${7.2*CELL_SIZE},${13.2*CELL_SIZE} ${7.8*CELL_SIZE},${13.2*CELL_SIZE}`} 
          fill="#FDD835" />

        {/* === INTEGRATED DICE === */}
        <DiceFace 
          value={displayValue}
          x={dicePos.x}
          y={dicePos.y}
          size={CELL_SIZE * 1.2}
          isActive={canRoll && !isRolling}
          onClick={handleDiceClick}
        />

        {/* === GAME TOKENS === */}
        {Object.keys(tokens).map(color => 
          tokens[color].map((token, idx) => {
            const pos = getTokenPosition(color, token);
            if (!pos) return null;

            const isMovable = movableTokens.includes(idx) && COLORS.indexOf(color) === currentPlayer;
            const colorDef = COLOR_DEFS[color];

            return (
              <g 
                key={`token-${color}-${idx}`} 
                className={isMovable ? styles.movableTokenGroup : ''}
                onClick={() => isMovable && onTokenClick(idx)}
                style={{ cursor: isMovable ? 'pointer' : 'default' }}
              >
                {/* Movable token glow rings */}
                {isMovable && (
                  <>
                    <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.55} 
                      fill="none" stroke={colorDef.glow} strokeWidth="3" className={styles.pulseRing} />
                    <circle cx={pos.x + CELL_SIZE/2} cy={pos.y + CELL_SIZE/2} r={CELL_SIZE*0.55} 
                      fill="none" stroke={colorDef.glow} strokeWidth="2" className={styles.pulseRing2} />
                  </>
                )}
                
                {/* Token shadow */}
                <ellipse 
                  cx={pos.x + CELL_SIZE/2 + 2} 
                  cy={pos.y + CELL_SIZE/2 + 4} 
                  rx={CELL_SIZE*0.32} 
                  ry={CELL_SIZE*0.18} 
                  fill="rgba(0,0,0,0.25)" 
                />
                
                {/* Token base (cone shape effect) */}
                <ellipse 
                  cx={pos.x + CELL_SIZE/2} 
                  cy={pos.y + CELL_SIZE/2 + CELL_SIZE*0.12} 
                  rx={CELL_SIZE*0.28} 
                  ry={CELL_SIZE*0.08} 
                  fill={colorDef.dark}
                />
                
                {/* Token body */}
                <circle 
                  cx={pos.x + CELL_SIZE/2} 
                  cy={pos.y + CELL_SIZE/2} 
                  r={CELL_SIZE*0.32} 
                  fill={colorDef.main}
                  stroke={colorDef.dark}
                  strokeWidth="2"
                />
                
                {/* Token shine effect */}
                <circle 
                  cx={pos.x + CELL_SIZE/2} 
                  cy={pos.y + CELL_SIZE/2} 
                  r={CELL_SIZE*0.32} 
                  fill="url(#tokenShine)"
                />
                
                {/* Token inner ring */}
                <circle 
                  cx={pos.x + CELL_SIZE/2} 
                  cy={pos.y + CELL_SIZE/2} 
                  r={CELL_SIZE*0.18} 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  opacity="0.6"
                />
                
                {/* Token center dot */}
                <circle 
                  cx={pos.x + CELL_SIZE/2} 
                  cy={pos.y + CELL_SIZE/2} 
                  r={CELL_SIZE*0.08} 
                  fill="white" 
                  opacity="0.8"
                />
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

export default LudoBoard;
