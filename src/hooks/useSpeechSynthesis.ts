import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  autoSpeak?: boolean;
}

export interface SpeechState {
  speaking: boolean;
  paused: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  error: string | null;
}

export function useSpeechSynthesis(options: SpeechSynthesisOptions = {}) {
  const {
    voice = null,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    autoSpeak = false,
  } = options;

  const [state, setState] = useState<SpeechState>({
    speaking: false,
    paused: false,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    voices: [],
    error: null,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  const loadVoices = useCallback(() => {
    if (!state.supported) return;

    const availableVoices = window.speechSynthesis.getVoices();
    setState((prev) => ({ ...prev, voices: availableVoices }));
  }, [state.supported]);

  useEffect(() => {
    if (!state.supported) return;

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [state.supported, loadVoices]);

  const speak = useCallback(
    (text: string, onComplete?: () => void) => {
      if (!state.supported) {
        setState((prev) => ({
          ...prev,
          error: 'Speech synthesis not supported in this browser',
        }));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.voice = voice || state.voices[0] || null;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setState((prev) => ({ ...prev, speaking: true, error: null }));
      };

      utterance.onend = () => {
        setState((prev) => ({ ...prev, speaking: false, paused: false }));
        if (onComplete) {
          onComplete();
        }

        if (queueRef.current.length > 0) {
          const nextText = queueRef.current.shift();
          if (nextText) {
            speak(nextText);
          }
        }
      };

      utterance.onerror = (event) => {
        setState((prev) => ({
          ...prev,
          speaking: false,
          error: `Speech error: ${event.error}`,
        }));
        console.error('Speech synthesis error:', event);
      };

      utterance.onpause = () => {
        setState((prev) => ({ ...prev, paused: true }));
      };

      utterance.onresume = () => {
        setState((prev) => ({ ...prev, paused: false }));
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to speak',
        }));
      }
    },
    [state.supported, state.voices, voice, rate, pitch, volume]
  );

  const pause = useCallback(() => {
    if (!state.supported) return;
    window.speechSynthesis.pause();
  }, [state.supported]);

  const resume = useCallback(() => {
    if (!state.supported) return;
    window.speechSynthesis.resume();
  }, [state.supported]);

  const cancel = useCallback(() => {
    if (!state.supported) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    setState((prev) => ({ ...prev, speaking: false, paused: false }));
  }, [state.supported]);

  const queue = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      if (!state.speaking) {
        const nextText = queueRef.current.shift();
        if (nextText) {
          speak(nextText);
        }
      }
    },
    [state.speaking, speak]
  );

  const getVoiceByName = useCallback(
    (name: string): SpeechSynthesisVoice | undefined => {
      return state.voices.find((v) => v.name === name);
    },
    [state.voices]
  );

  const getVoicesByLang = useCallback(
    (lang: string): SpeechSynthesisVoice[] => {
      return state.voices.filter((v) => v.lang.startsWith(lang));
    },
    [state.voices]
  );

  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    const englishVoices = getVoicesByLang('en');

    const preferredNames = [
      'Samantha',
      'Alex',
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Karen',
      'Daniel',
    ];

    for (const name of preferredNames) {
      const voice = englishVoices.find((v) => v.name.includes(name));
      if (voice) return voice;
    }

    return englishVoices.find((v) => v.default) || englishVoices[0];
  }, [getVoicesByLang]);

  return {
    ...state,
    speak,
    pause,
    resume,
    cancel,
    queue,
    getVoiceByName,
    getVoicesByLang,
    getPreferredVoice,
  };
}
