import { useState, useRef, useCallback, useEffect } from 'react';

const RECORDING_TIME_LIMIT_MS = 15000;

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const timeoutTriggeredRef = useRef(false);

  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let sumSquares = 0.0;
    for (const amplitude of dataArray) {
      const normalizedAmplitude = (amplitude / 128.0) - 1.0;
      sumSquares += normalizedAmplitude * normalizedAmplitude;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    const volumeLevel = Math.min(1, rms * 5);
    setVolume(volumeLevel);

    animationFrameRef.current = requestAnimationFrame(monitorVolume);
  }, []);

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      stopMonitoring();
      
      setRecorderError(null);
      timeoutTriggeredRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      monitorVolume();

      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];
      
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn(`${options.mimeType} is not supported, using browser default.`);
          delete (options as any).mimeType;
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        if (timeoutTriggeredRef.current) {
            setRecorderError("Recording timed out. Please keep your recording under 15 seconds and try again.");
            setAudioBlob(null);
            setAudioUrl(null);
            audioChunksRef.current = [];
        } else if (audioChunksRef.current.length > 0) {
            const newAudioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
            setAudioBlob(newAudioBlob);
            setAudioUrl(URL.createObjectURL(newAudioBlob));
        } else {
            console.warn("Recording stopped, but no audio data was captured.");
        }
        
        setIsRecording(false);
        stopMonitoring();
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      });
      
      recorder.start();
      
      timerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            timeoutTriggeredRef.current = true;
            mediaRecorderRef.current.stop();
        }
      }, RECORDING_TIME_LIMIT_MS);

    } catch (err) {
      console.error('Error starting recording:', err);
      setRecorderError("Could not start recording. Please check microphone permissions.");
      setIsRecording(false);
      stopMonitoring();
    }
  }, [monitorVolume, stopMonitoring]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);
  
  useEffect(() => {
    return () => {
      stopMonitoring();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
          clearTimeout(timerRef.current);
      }
    };
  }, [stopMonitoring]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    volume,
    recorderError,
    startRecording,
    stopRecording,
  };
};