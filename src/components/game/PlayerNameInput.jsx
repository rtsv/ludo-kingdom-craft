import { Plus, Minus } from "lucide-react";
import styles from "./PlayerNameInput.module.css";

function PlayerNameInput({ 
  players, 
  onPlayerChange, 
  onAddPlayer, 
  onRemovePlayer,
  minPlayers = 2,
  showSymbols = false,
  symbols = []
}) {
  return (
    <div className={styles.container}>
      {players.map((name, index) => (
        <div key={index} className={styles.playerRow}>
          {showSymbols && symbols[index] && (
            <span className={styles.symbol}>{symbols[index]}</span>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => onPlayerChange(index, e.target.value)}
            placeholder={`Player ${index + 1}`}
            className={styles.input}
            maxLength={20}
          />
          {onRemovePlayer && players.length > minPlayers && (
            <button 
              onClick={() => onRemovePlayer(index)} 
              className={styles.removeButton}
            >
              <Minus size={16} />
            </button>
          )}
        </div>
      ))}
      
      {onAddPlayer && (
        <button onClick={onAddPlayer} className={styles.addButton}>
          <Plus size={18} />
          <span>Add Player</span>
        </button>
      )}
    </div>
  );
}

export default PlayerNameInput;
