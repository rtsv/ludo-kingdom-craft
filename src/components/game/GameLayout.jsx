import { ArrowLeft } from "lucide-react";
import styles from "./GameLayout.module.css";

function GameLayout({ title, onBack, children, currentPlayer }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className={styles.title}>{title}</h1>
        {currentPlayer && (
          <span className={styles.currentPlayer}>
            Current: {currentPlayer}
          </span>
        )}
      </header>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}

export default GameLayout;
