// Simple game sound effects using Web Audio API
// No external files needed - generates sounds programmatically

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Play a pleasant ascending tone for correct actions
export const playCorrectSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn('Audio not supported:', e);
  }
};

// Play a descending buzz for wrong actions
export const playWrongSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('Audio not supported:', e);
  }
};

// Play a victory fanfare
export const playWinSound = () => {
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
      
      oscillator.start(ctx.currentTime + i * 0.12);
      oscillator.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch (e) {
    console.warn('Audio not supported:', e);
  }
};
