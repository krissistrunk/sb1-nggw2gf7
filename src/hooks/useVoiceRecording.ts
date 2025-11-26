import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type RecordingState = 'idle' | 'requesting_permission' | 'recording' | 'processing' | 'error';

export interface VoiceRecordingOptions {
  maxDurationSeconds?: number;
  mimeType?: string;
  silenceThresholdSeconds?: number;
  silenceDecibelThreshold?: number;
  onSilenceDetected?: () => void;
}

export interface VoiceRecordingResult {
  audioUrl: string;
  blob: Blob;
  durationSeconds: number;
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [currentAudioLevel, setCurrentAudioLevel] = useState<number>(0);
  const [silenceDuration, setSilenceDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);

  const {
    maxDurationSeconds = 300,
    mimeType = 'audio/webm;codecs=opus',
    silenceThresholdSeconds = 10,
    silenceDecibelThreshold = -40,
    onSilenceDetected,
  } = options;

  const checkMicrophonePermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionGranted(result.state === 'granted');
      return result.state === 'granted';
    } catch {
      return null;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    setState('requesting_permission');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      setState('idle');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      setPermissionGranted(false);
      setState('error');
      return false;
    }
  }, []);

  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    silenceStartTimeRef.current = null;
    setSilenceDuration(0);
    setCurrentAudioLevel(0);
  }, []);

  const analyzeAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current || state !== 'recording') {
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const decibels = 20 * Math.log10(average / 255);

      setCurrentAudioLevel(Math.max(0, Math.min(100, (average / 255) * 100)));

      const isSilent = decibels < silenceDecibelThreshold;

      if (isSilent) {
        if (silenceStartTimeRef.current === null) {
          silenceStartTimeRef.current = Date.now();
        }

        const silenceDurationMs = Date.now() - silenceStartTimeRef.current;
        const silenceDurationSec = Math.floor(silenceDurationMs / 1000);
        setSilenceDuration(silenceDurationSec);

        if (silenceDurationSec >= silenceThresholdSeconds) {
          if (onSilenceDetected) {
            onSilenceDetected();
          }
          stopRecording();
          return;
        }
      } else {
        silenceStartTimeRef.current = null;
        setSilenceDuration(0);
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [state, silenceThresholdSeconds, silenceDecibelThreshold, onSilenceDetected]);

  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      analyzeAudioLevels();
    } catch (err) {
      console.error('Failed to setup audio analysis:', err);
    }
  }, [analyzeAudioLevels]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Voice recording is not supported in this browser');
      setState('error');
      return false;
    }

    try {
      setState('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      if (!supportedMimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        const error = (event as any).error;
        setError(error?.message || 'Recording error occurred');
        setState('error');
        stopRecording();
      };

      mediaRecorder.start(1000);
      setState('recording');
      startTimeRef.current = Date.now();
      setDurationSeconds(0);
      setSilenceDuration(0);
      silenceStartTimeRef.current = null;

      setupAudioAnalysis(stream);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(elapsed);

        if (elapsed >= maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);

      setPermissionGranted(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setState('error');
      setPermissionGranted(false);
      return false;
    }
  }, [mimeType, maxDurationSeconds, setupAudioAnalysis]);

  const stopRecording = useCallback((): Promise<VoiceRecordingResult | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setState('idle');
        resolve(null);
        return;
      }

      setState('processing');

      mediaRecorder.onstop = () => {
        cleanupAudioAnalysis();

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setState('idle');
        resolve({
          audioUrl,
          blob: audioBlob,
          durationSeconds: duration,
        });
      };

      mediaRecorder.stop();
    });
  }, [cleanupAudioAnalysis]);

  const cancelRecording = useCallback(() => {
    cleanupAudioAnalysis();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setState('idle');
    setDurationSeconds(0);
    setError(null);
  }, [cleanupAudioAnalysis]);

  const uploadRecording = useCallback(
    async (blob: Blob): Promise<string | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      try {
        setState('processing');
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}.webm`;

        const { data, error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('voice-recordings')
          .getPublicUrl(data.path);

        setState('idle');
        return urlData.publicUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload recording';
        setError(message);
        setState('error');
        return null;
      }
    },
    [user]
  );

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  return {
    state,
    error,
    durationSeconds,
    permissionGranted,
    currentAudioLevel,
    silenceDuration,
    checkMicrophonePermission,
    requestMicrophonePermission,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadRecording,
    blobToBase64,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    isIdle: state === 'idle',
  };
}
