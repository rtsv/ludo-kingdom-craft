import { useState } from "react";
import styles from "./OnlineRoomSetup.module.css";

function OnlineRoomSetup({ 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onCreateRoom, 
  onJoinRoom,
  gameName = "Game"
}) {
  const [isJoining, setIsJoining] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <label className={styles.label}>Your Name</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className={styles.input}
          maxLength={20}
        />
      </div>

      <div className={styles.actions}>
        <button 
          onClick={onCreateRoom} 
          className={styles.createButton}
          disabled={!playerName.trim()}
        >
          🏠 Create Room
        </button>
        
        <div className={styles.divider}>
          <span>or</span>
        </div>
        
        {!isJoining ? (
          <button 
            onClick={() => setIsJoining(true)} 
            className={styles.joinToggle}
          >
            Join Existing Room
          </button>
        ) : (
          <div className={styles.joinSection}>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className={styles.input}
              maxLength={8}
            />
            <button 
              onClick={onJoinRoom} 
              className={styles.joinButton}
              disabled={!playerName.trim() || !roomCode.trim()}
            >
              🚀 Join Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnlineRoomSetup;
