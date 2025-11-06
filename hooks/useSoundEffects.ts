import { soundService } from '../services/soundService';

export const useSoundEffects = () => {
  // This hook provides a simple interface to the sound service.
  // The audio unlocking logic is handled globally in App.tsx to ensure it's
  // triggered by the first user interaction.
  return {
    playClick: soundService.playClick,
    playSuccess: soundService.playSuccess,
    playError: soundService.playError,
    playNotification: soundService.playNotification,
  };
};
