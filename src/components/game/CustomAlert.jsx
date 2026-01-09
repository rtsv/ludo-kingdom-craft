import { useEffect } from "react";
import { X } from "lucide-react";
import styles from "./CustomAlert.module.css";

function CustomAlert({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={styles.overlay}>
      <div className={styles.alert}>
        <p className={styles.message}>{message}</p>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;
