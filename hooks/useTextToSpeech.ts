import { useState, useCallback, useEffect, useRef } from 'react';
import type { Language } from '../types';

// --- Module-level variables to act as a singleton cache ---

// This flag ensures we only run diagnostics once per session.
let diagnosticsRun = false;

// Caches the list of voices to avoid repeatedly calling the expensive getVoices() method.
let voiceCache: SpeechSynthesisVoice[] = [];

// A promise that resolves when voices are loaded, ensuring we only have one loading process at a time.
let voiceLoaderPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export interface AvailableVoices {
    english: SpeechSynthesisVoice[];
    tamil: SpeechSynthesisVoice[];
    malayalam: SpeechSynthesisVoice[];
}

/**
 * A robust function to load and cache the browser's speech synthesis voices.
 * It handles browser inconsistencies by polling and using onvoiceschanged.
 */
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    // If voices are already cached, return them immediately.
    if (voiceCache.length > 0) {
        return Promise.resolve(voiceCache);
    }
    // If a loading process is already underway, return its promise.
    if (voiceLoaderPromise) {
        return voiceLoaderPromise;
    }

    voiceLoaderPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn("Speech Synthesis API not supported by this browser.");
            resolve([]);
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 20; // Poll for up to 5 seconds (20 * 250ms), giving slow browsers time to load.

        const checkAndResolveVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voiceCache = voices;
                if (!diagnosticsRun) {
                    console.log("--- Linguacare TTS Diagnostics: Available Voices ---");
                    voices.forEach(v => console.log(`- Voice: ${v.name}, Lang: ${v.lang}, Default: ${v.default}`));
                    if (!voices.some(v => v.lang.toLowerCase().startsWith('ta'))) console.warn("TTS Warning: Tamil (ta-IN) voice may not be available.");
                    if (!voices.some(v => v.lang.toLowerCase().startsWith('ml'))) console.warn("TTS Warning: Malayalam (ml-IN) voice may not be available.");
                    console.log("-------------------------------------------------");
                    diagnosticsRun = true;
                }
                return true; // Indicate that voices were found
            }
            return false; // Indicate voices not found yet
        };

        // Immediately check if voices are already available.
        if (checkAndResolveVoices()) {
            resolve(voiceCache);
            return;
        }

        // If not, set up polling as a reliable fallback.
        const intervalId = setInterval(() => {
            attempts++;
            if (checkAndResolveVoices()) {
                clearInterval(intervalId);
                resolve(voiceCache);
            } else if (attempts > maxAttempts) {
                clearInterval(intervalId);
                console.error("TTS Error: Timed out waiting for voices to load.");
                reject(new Error("Timed out waiting for voices."));
            }
        }, 250);

        // Also listen to the 'onvoiceschanged' event as the primary mechanism.
        window.speechSynthesis.onvoiceschanged = () => {
            if (checkAndResolveVoices()) {
                clearInterval(intervalId); // Stop polling if the event fires successfully
                resolve(voiceCache);
            }
        };
    });
    
    return voiceLoaderPromise;
};

/**
 * A robust hook for handling text-to-speech functionality with failsafes for browser quirks.
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<AvailableVoices>({ english: [], tamil: [], malayalam: [] });

  const isMountedRef = useRef(true);
  const timeoutRef = useRef<number | null>(null);
  // A ref to hold the current utterance to prevent it from being garbage collected prematurely.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const categorizeVoices = (voices: SpeechSynthesisVoice[]) => {
            const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
            const tamilVoices = voices.filter(v => v.lang.toLowerCase().startsWith('ta'));
            const malayalamVoices = voices.filter(v => v.lang.toLowerCase().startsWith('ml'));
            if (isMountedRef.current) {
                setAvailableVoices({ english: englishVoices, tamil: tamilVoices, malayalam: malayalamVoices });
                setVoicesLoading(false);
            }
        };

        loadVoices()
            .then(categorizeVoices)
            .catch(err => {
                console.error("TTS: Failed to load voices for settings.", err);
                if (isMountedRef.current) {
                    setVoicesLoading(false);
                }
            });

        // Keep-alive interval to prevent the speech engine from sleeping, especially on mobile.
        const keepAliveInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.resume();
            }
        }, 14000);

        return () => {
            isMountedRef.current = false;
            clearInterval(keepAliveInterval);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

  const speak = useCallback(async (text: string, language: Language) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isMountedRef.current) {
      return;
    }

    const resetState = (reason: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        utteranceRef.current = null;
        if (isMountedRef.current) {
            setIsSpeaking(false);
        }
        console.log(`TTS: State reset. Reason: ${reason}`);
    };

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    console.log(`TTS: Attempting to speak "${text}" in ${language}.`);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
        console.warn(`TTS Failsafe: Timed out after 8s for "${text}". Forcibly cancelling and resetting state.`);
        window.speechSynthesis.cancel();
        resetState("Failsafe Timeout");
    }, 8000);

    try {
        const voices = await loadVoices();
        if (voices.length === 0) {
            throw new Error("No speech synthesis voices are available.");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const langCodeMap = { english: 'en-US', tamil: 'ta-IN', malayalam: 'ml-IN' };
        const langCode = langCodeMap[language];
        utterance.lang = langCode;
        
        let selectedVoice: SpeechSynthesisVoice | null = null;
        
        // 1. Try to get user's preferred voice from localStorage
        const preferredVoiceName = localStorage.getItem(`linguacare_tts_voice_${langCode}`);
        if (preferredVoiceName) {
            selectedVoice = voices.find(v => v.name === preferredVoiceName) || null;
             if (selectedVoice) {
                console.log(`TTS: Using preferred voice '${selectedVoice.name}'.`);
            } else {
                 console.warn(`TTS Warning: Preferred voice '${preferredVoiceName}' not found. Falling back to default selection.`);
            }
        }
        
        // 2. If no preference or preferred voice not found, use intelligent selection logic
        if (!selectedVoice) {
            const targetLangCode = langCode.toLowerCase();
            const baseLangCode = targetLangCode.split('-')[0];
            const candidateVoices = voices.filter(v => v.lang.toLowerCase().startsWith(baseLangCode));
            
            selectedVoice = candidateVoices.find(v => v.lang.toLowerCase() === targetLangCode && /google/i.test(v.name)) || null;
            if (!selectedVoice) selectedVoice = candidateVoices.find(v => v.lang.toLowerCase() === targetLangCode) || null;
            if (!selectedVoice) selectedVoice = candidateVoices.find(v => /google/i.test(v.name)) || null;
            if (!selectedVoice) selectedVoice = candidateVoices[0] || null;
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`TTS: Using voice '${selectedVoice.name}' (${selectedVoice.lang}) for language '${language}'.`);
        } else {
            console.warn(`TTS Warning: No specific voice found for lang '${langCode}'. Using browser default.`);
        }

        utterance.onend = () => resetState(`onend event for "${text}"`);
        utterance.onerror = (event) => {
            console.error(`SpeechSynthesis Error: ${event.error}`, event);
            resetState(`onerror event for "${text}"`);
        };
        
        window.speechSynthesis.speak(utterance);

    } catch(error) {
        console.error("TTS Error: Failed to initiate speech:", error);
        resetState(`Caught error during speak setup: ${error}`);
    }
  }, []);

  return { isSpeaking, speak, voicesLoading, availableVoices };
};
