// services/soundService.ts

let audioContext: AudioContext | null = null;
let isUnlocked = false;

const initAudioContext = () => {
  if (audioContext === null && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
    }
  }
};

// Must be called from a user-initiated event (e.g., click) to comply with browser autoplay policies.
export const unlockAudio = () => {
    if (!isUnlocked) {
        initAudioContext();
        isUnlocked = true;
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContext || !isUnlocked || audioContext.state !== 'running') return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};


export const soundService = {
  playClick: () => {
    playTone(2200, 0.08, 'triangle');
  },
  playSuccess: () => {
    playTone(1200, 0.1, 'sine');
    setTimeout(() => playTone(1500, 0.15, 'sine'), 80);
  },
  playError: () => {
    playTone(300, 0.15, 'square');
    setTimeout(() => playTone(200, 0.2, 'square'), 100);
  },
  playNotification: () => {
    playTone(1800, 0.1, 'sine');
  },
};
