import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Sparkles, MessageCircle, Loader, Volume2, VolumeX, Brain, Activity, Clock } from 'lucide-react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { aiService } from '../lib/ai-service';
import { useKnowledge } from '../hooks/useKnowledge';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { RelevantKnowledgeSidebar } from './RelevantKnowledgeSidebar';

type SessionType = 'PLANNING' | 'REFLECTION' | 'COACHING' | 'MOTIVATION' | 'CLARIFICATION';

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
}

interface VoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: SessionType;
  prompt?: string;
  contextData?: any;
  onComplete?: (transcript: string, insights: any) => void | Promise<void>;
}

interface UserVoiceSettings {
  autoDelaySeconds: number;
  silenceTimeout: number;
  audioCuesEnabled: boolean;
}

export function VoiceCoachModal({
  isOpen,
  onClose,
  sessionType,
  prompt,
  contextData,
  onComplete,
}: VoiceCoachModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [extractingKnowledge, setExtractingKnowledge] = useState(false);
  const [relevantKnowledge, setRelevantKnowledge] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [autoRecordCountdown, setAutoRecordCountdown] = useState<number | null>(null);
  const [isAutoRecording, setIsAutoRecording] = useState(false);
  const [silenceDetectedWarning, setSilenceDetectedWarning] = useState(false);
  const [userSettings, setUserSettings] = useState<UserVoiceSettings>({
    autoDelaySeconds: 5,
    silenceTimeout: 10,
    audioCuesEnabled: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { extractKnowledgeFromSession } = useKnowledge();
  const { organization } = useOrganization();
  const { user } = useAuth();

  const handleSilenceDetected = useCallback(() => {
    setSilenceDetectedWarning(true);
    if (userSettings.audioCuesEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [userSettings.audioCuesEnabled]);

  const {
    state,
    durationSeconds,
    currentAudioLevel,
    silenceDuration,
    startRecording,
    stopRecording,
    blobToBase64,
    isRecording,
  } = useVoiceRecording({
    maxDurationSeconds: 300,
    silenceThresholdSeconds: userSettings.silenceTimeout,
    onSilenceDetected: handleSilenceDetected,
  });

  const {
    speaking,
    supported: speechSupported,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis({ autoSpeak });

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('voice_coach_auto_delay_seconds, voice_coach_silence_timeout, voice_coach_audio_cues')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserSettings({
          autoDelaySeconds: data.voice_coach_auto_delay_seconds || 5,
          silenceTimeout: data.voice_coach_silence_timeout || 10,
          audioCuesEnabled: data.voice_coach_audio_cues || false,
        });
      }
    };

    if (isOpen) {
      loadUserSettings();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (userSettings.audioCuesEnabled) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGmi77OScTgwPUKfh8LZjHAU7k9n0znkrBSh+zPLaizsKGGO36+mgUhQKRp/g8r5sHwUrgs/z2Yk2Bxpou+zknEsMD1Cn4fC2YxwFO5PZ9M55KwUofsz03Is7ChoAAAD//wAA');
    }
  }, [userSettings.audioCuesEnabled]);

  const startAutoRecordCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setAutoRecordCountdown(userSettings.autoDelaySeconds);

    countdownTimerRef.current = setInterval(() => {
      setAutoRecordCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setAutoRecordCountdown(null);
          setIsAutoRecording(true);
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [userSettings.autoDelaySeconds, startRecording]);

  const cancelAutoRecordCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoRecordCountdown(null);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && prompt) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'coach',
        content: prompt,
        timestamp: new Date(),
        isQuestion: prompt.includes('?'),
      };
      setMessages([welcomeMessage]);
      setQuestionCount(welcomeMessage.isQuestion ? 1 : 0);

      if (autoSpeak && speechSupported) {
        setTimeout(() => {
          speak(prompt, () => {
            startAutoRecordCountdown();
          });
        }, 500);
      } else {
        startAutoRecordCountdown();
      }
    }
  }, [isOpen, prompt, autoSpeak, speechSupported, speak, startAutoRecordCountdown]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isRecording && silenceDetectedWarning) {
      setSilenceDetectedWarning(false);
    }
  }, [isRecording, silenceDetectedWarning]);

  const detectIfQuestion = (text: string): boolean => {
    const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'would', 'could', 'can', 'do', 'does', 'is', 'are'];
    const lowerText = text.toLowerCase().trim();
    return lowerText.includes('?') || questionWords.some(word => lowerText.startsWith(word + ' '));
  };

  const handleRecordingComplete = async (audioUrl: string, blob: Blob, duration: number) => {
    try {
      setIsTranscribing(true);
      setError(null);
      setIsAutoRecording(false);

      const base64Audio = await blobToBase64(blob);

      const result = await aiService.transcribeVoice(base64Audio, sessionType as any);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: result.transcript,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setCurrentTranscript(result.transcript);

      const userMessages = updatedMessages.filter(m => m.role === 'user');
      const recentCoachMessages = updatedMessages.filter(m => m.role === 'coach').slice(-5);
      const recentQuestionCount = recentCoachMessages.filter(m => m.isQuestion).length;

      const conversationHistory = updatedMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const contextWithQuestionCount = {
        ...contextData,
        questionCount: recentQuestionCount,
        totalUserMessages: userMessages.length,
      };

      const coachResponse = await aiService.coachingResponse(
        sessionType,
        result.transcript,
        conversationHistory,
        contextWithQuestionCount
      );

      if (coachResponse.relevantKnowledge && coachResponse.relevantKnowledge.length > 0) {
        setRelevantKnowledge(coachResponse.relevantKnowledge);
      }

      const isQuestion = detectIfQuestion(coachResponse.response);

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: coachResponse.response,
        timestamp: new Date(),
        isQuestion,
      };

      const newMessages = [...updatedMessages, coachMessage];
      setMessages(newMessages);

      if (isQuestion) {
        setQuestionCount(prev => prev + 1);
      } else {
        setQuestionCount(0);
      }

      if (autoSpeak && speechSupported) {
        setTimeout(() => {
          speak(coachResponse.response, () => {
            startAutoRecordCountdown();
          });
        }, 300);
      } else {
        startAutoRecordCountdown();
      }

      setIsTranscribing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      setIsTranscribing(false);
      setIsAutoRecording(false);
    }
  };

  const handleComplete = async () => {
    cancelAutoRecordCountdown();

    if (messages.length > 2) {
      setExtractingKnowledge(true);
      try {
        const conversationHistory = messages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        await extractKnowledgeFromSession(
          'session-' + Date.now(),
          conversationHistory,
          sessionType
        );

        if (autoSpeak && speechSupported) {
          speak('I\'ve captured key insights from our conversation and added them to your knowledge base.');
        }
      } catch (err) {
        console.error('Failed to extract knowledge:', err);
      } finally {
        setExtractingKnowledge(false);
      }
    }

    if (onComplete && currentTranscript) {
      const insights = {
        messages,
        sessionType,
        totalMessages: messages.length,
        userMessages: messages.filter((m) => m.role === 'user').length,
        questionCount,
      };
      onComplete(currentTranscript, insights);
    }
    handleClose();
  };

  const handleClose = () => {
    cancelAutoRecordCountdown();
    cancelSpeech();
    setMessages([]);
    setCurrentTranscript('');
    setError(null);
    setQuestionCount(0);
    setIsAutoRecording(false);
    onClose();
  };

  const handleManualRecord = async () => {
    cancelAutoRecordCountdown();

    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await handleRecordingComplete(
          result.audioUrl,
          result.blob,
          result.durationSeconds
        );
      }
    } else if (!isTranscribing) {
      cancelSpeech();
      setIsAutoRecording(false);
      await startRecording();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeLabel = (type: SessionType): string => {
    const labels = {
      PLANNING: 'Planning Session',
      REFLECTION: 'Reflection Session',
      COACHING: 'Coaching Session',
      MOTIVATION: 'Motivation Session',
      CLARIFICATION: 'Clarification Session',
    };
    return labels[type];
  };

  if (!isOpen) return null;

  const showSilenceWarning = isRecording && silenceDuration >= 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-3xl h-[90vh] bg-gradient-to-br from-primary-50 to-purple-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Voice Coach</h2>
              <p className="text-sm text-gray-600">{getSessionTypeLabel(sessionType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {questionCount > 0 && (
              <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                {questionCount} question{questionCount !== 1 ? 's' : ''} deep
              </div>
            )}
            {speechSupported && (
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-lg transition-colors ${
                  autoSpeak
                    ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={autoSpeak ? 'Auto-speak enabled' : 'Auto-speak disabled'}
              >
                {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <RelevantKnowledgeSidebar
            notes={relevantKnowledge}
            isVisible={relevantKnowledge.length > 0 && messages.length > 0}
          />

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-900 shadow-md border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'coach' && (
                    <MessageCircle className="w-5 h-5 mt-1 flex-shrink-0 text-primary-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p
                        className={`text-xs ${
                          message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.role === 'coach' && speechSupported && (
                        <button
                          onClick={() => speak(message.content)}
                          className="text-primary-500 hover:text-primary-600 transition-colors"
                          title="Listen to this message"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTranscribing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-md border border-gray-200">
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 text-primary-500 animate-spin" />
                  <p className="text-gray-600">Processing your message...</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {autoRecordCountdown !== null ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Coach will listen in {autoRecordCountdown}s...
                </span>
              ) : isRecording ? (
                isAutoRecording ? 'Auto-recording: Speak naturally...' : 'Recording: Speak naturally...'
              ) : (
                'Press the microphone to start speaking'
              )}
            </p>
            {messages.length > 1 && !isRecording && !isTranscribing && autoRecordCountdown === null && (
              <button
                onClick={handleComplete}
                disabled={extractingKnowledge}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extractingKnowledge ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse" />
                    Extracting Knowledge...
                  </>
                ) : (
                  'Complete Session'
                )}
              </button>
            )}
          </div>

          {autoRecordCountdown !== null && (
            <div className="mb-4 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg className="transform -rotate-90 w-16 h-16">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - autoRecordCountdown / userSettings.autoDelaySeconds)}`}
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">{autoRecordCountdown}</span>
                  </div>
                </div>
                <button
                  onClick={cancelAutoRecordCountdown}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Skip countdown
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleManualRecord}
              disabled={isTranscribing || autoRecordCountdown !== null}
              className={`
                w-20 h-20 rounded-full
                flex items-center justify-center
                transition-all duration-200
                shadow-lg
                relative
                ${
                  isRecording
                    ? isAutoRecording
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-red-500 hover:bg-red-600'
                    : 'bg-gradient-to-br from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600'
                }
                text-white
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isRecording && (
                <div className={`absolute inset-0 ${isAutoRecording ? 'bg-blue-500' : 'bg-red-500'} rounded-full animate-ping opacity-75`}></div>
              )}
              {isTranscribing ? (
                <Loader className="w-10 h-10 animate-spin relative z-10" />
              ) : (
                <Mic className="w-10 h-10 relative z-10" />
              )}
            </button>
          </div>

          {isRecording && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono text-red-700 font-medium">
                    {formatTime(durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${currentAudioLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {showSilenceWarning && (
                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    Silence detected ({silenceDuration}s) - Recording will stop at {userSettings.silenceTimeout}s
                  </p>
                </div>
              )}
            </div>
          )}

          {state === 'requesting_permission' && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Requesting microphone access...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
