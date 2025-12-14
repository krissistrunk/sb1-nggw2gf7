import { supabase } from './supabase';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  category: 'premade' | 'cloned' | 'generated';
  labels?: Record<string, string>;
  preview_url?: string;
}

export const POPULAR_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Rachel',
    description: 'Warm, friendly female voice - great for coaching',
    category: 'premade',
    labels: { accent: 'american', age: 'young', gender: 'female' },
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Antoni',
    description: 'Calm, reassuring male voice - excellent for reflection',
    category: 'premade',
    labels: { accent: 'american', age: 'young', gender: 'male' },
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    description: 'Energetic, motivating male voice - perfect for action planning',
    category: 'premade',
    labels: { accent: 'american', age: 'young', gender: 'male' },
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Domi',
    description: 'Clear, articulate female voice - ideal for clarity sessions',
    category: 'premade',
    labels: { accent: 'american', age: 'young', gender: 'female' },
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Elli',
    description: 'Gentle, supportive female voice - great for gentle coaching',
    category: 'premade',
    labels: { accent: 'american', age: 'middle aged', gender: 'female' },
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Callum',
    description: 'Professional, confident male voice - excellent for business coaching',
    category: 'premade',
    labels: { accent: 'american', age: 'middle aged', gender: 'male' },
  },
];

class ElevenLabsService {
  private cache: Map<string, string> = new Map();
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ElevenLabsCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('audioCache')) {
          db.createObjectStore('audioCache');
        }
      };
    });
  }

  async getCachedAudio(key: string): Promise<string | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readonly');
      const store = transaction.objectStore('audioCache');
      const request = store.get(key);

      request.onsuccess = () => {
        const audioUrl = request.result;
        if (audioUrl) {
          this.cache.set(key, audioUrl);
          resolve(audioUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  async cacheAudio(key: string, audioUrl: string): Promise<void> {
    this.cache.set(key, audioUrl);

    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      store.put(audioUrl, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  }

  generateCacheKey(text: string, voiceId: string): string {
    return `${voiceId}:${text.substring(0, 100)}`;
  }

  async textToSpeech(
    text: string,
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL',
    options?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    }
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(text, voiceId);
    const cached = await this.getCachedAudio(cacheKey);

    if (cached) {
      return cached;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const apiUrl = `${supabaseUrl}/functions/v1/ai-assistant`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feature: 'elevenlabs-tts',
        data: {
          text,
          voiceId,
          options: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarity_boost ?? 0.75,
            style: options?.style ?? 0,
            use_speaker_boost: options?.use_speaker_boost ?? true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Text-to-speech failed');
    }

    const result = await response.json();
    const audioUrl = result.data.audioUrl;

    await this.cacheAudio(cacheKey, audioUrl);

    return audioUrl;
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    return POPULAR_VOICES;
  }

  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Failed to play audio'));

      audio.play().catch(reject);
    });
  }

  clearCache(): void {
    this.cache.clear();

    if (this.db) {
      const transaction = this.db.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      store.clear();
    }
  }
}

export const elevenlabsService = new ElevenLabsService();
