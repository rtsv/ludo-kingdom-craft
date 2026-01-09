import styles from "./GameModeSelector.module.css";

function GameModeSelector({ 
  onSelectLocal, 
  onSelectOnline, 
  localLabel = "Local Play",
  onlineLabel = "Online Multiplayer",
  maxPlayers
}) {
  return (
    <div className={styles.container}>
      <button onClick={onSelectLocal} className={styles.modeButton}>
        <span className={styles.icon}>🎮</span>
        <span className={styles.label}>{localLabel}</span>
        <span className={styles.description}>Play on the same device</span>
      </button>
      
      <button onClick={onSelectOnline} className={styles.modeButton}>
        <span className={styles.icon}>🌐</span>
        <span className={styles.label}>{onlineLabel}</span>
        <span className={styles.description}>
          {maxPlayers ? `${maxPlayers}` : "Play with friends online"}
        </span>
      </button>
    </div>
  );
}

export default GameModeSelector;
