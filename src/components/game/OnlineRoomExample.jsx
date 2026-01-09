import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import styles from "./OnlineRoomExample.module.css";

function OnlineRoomExample({ 
  roomCode, 
  connectedPlayers, 
  maxPlayers, 
  isHost, 
  onStartGame,
  minPlayers = 2,
  gameUrl
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl || roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const canStart = connectedPlayers.length >= minPlayers && connectedPlayers.length <= maxPlayers;

  return (
    <div className={styles.container}>
      <div className={styles.roomInfo}>
        <h2 className={styles.title}>Waiting Room</h2>
        
        <div className={styles.codeSection}>
          <span className={styles.codeLabel}>Room Code</span>
          <div className={styles.codeBox}>
            <span className={styles.code}>{roomCode}</span>
            <button onClick={copyToClipboard} className={styles.copyButton}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.shareHint}>
          Share this code with friends to join!
        </div>
      </div>

      <div className={styles.playersSection}>
        <div className={styles.playersHeader}>
          <Users size={20} />
          <span>Players ({connectedPlayers.length}/{maxPlayers})</span>
        </div>
        
        <div className={styles.playersList}>
          {connectedPlayers.map((player, index) => (
            <div key={player.playerId || index} className={styles.playerCard}>
              <span className={styles.playerNumber}>{index + 1}</span>
              <span className={styles.playerName}>{player.playerName}</span>
              {player.isHost && <span className={styles.hostBadge}>Host</span>}
            </div>
          ))}
          
          {Array.from({ length: Math.max(0, minPlayers - connectedPlayers.length) }).map((_, i) => (
            <div key={`waiting-${i}`} className={styles.waitingSlot}>
              <span className={styles.waitingText}>Waiting for player...</span>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <button 
          onClick={onStartGame} 
          className={styles.startButton}
          disabled={!canStart}
        >
          {canStart ? '🎮 Start Game' : `Need ${minPlayers - connectedPlayers.length} more player(s)`}
        </button>
      )}

      {!isHost && (
        <div className={styles.waitingMessage}>
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}

export default OnlineRoomExample;
