import { useState, useEffect, useRef } from 'react';
import { X, Mic, Sparkles, MessageCircle, Loader, Volume2, VolumeX, Brain } from 'lucide-react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { aiService } from '../lib/ai-service';
import { useKnowledge } from '../hooks/useKnowledge';
import { useOrganization } from '../contexts/OrganizationContext';
import { RelevantKnowledgeSidebar } from './RelevantKnowledgeSidebar';

type SessionType = 'PLANNING' | 'REFLECTION' | 'COACHING' | 'MOTIVATION' | 'CLARIFICATION';

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

interface VoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: SessionType;
  prompt?: string;
  contextData?: any;
  onComplete?: (transcript: string, insights: any) => void | Promise<void>;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { extractKnowledgeFromSession } = useKnowledge();
  const { organization } = useOrganization();

  const {
    state,
    durationSeconds,
    startRecording,
    stopRecording,
    blobToBase64,
    isRecording,
  } = useVoiceRecording({ maxDurationSeconds: 300 });

  const {
    speaking,
    supported: speechSupported,
    speak,
    cancel: cancelSpeech,
    getPreferredVoice,
  } = useSpeechSynthesis({ autoSpeak });

  useEffect(() => {
    if (isOpen && prompt) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'coach',
        content: prompt,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      if (autoSpeak && speechSupported) {
        setTimeout(() => speak(prompt), 500);
      }
    }
  }, [isOpen, prompt, autoSpeak, speechSupported, speak]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRecordingComplete = async (audioUrl: string, blob: Blob, duration: number) => {
    try {
      setIsTranscribing(true);
      setError(null);

      const base64Audio = await blobToBase64(blob);

      const result = await aiService.transcribeVoice(base64Audio, sessionType);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: result.transcript,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setCurrentTranscript(result.transcript);

      const conversationHistory = updatedMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const coachResponse = await aiService.coachingResponse(
        sessionType,
        result.transcript,
        conversationHistory,
        contextData
      );

      if (coachResponse.relevantKnowledge && coachResponse.relevantKnowledge.length > 0) {
        setRelevantKnowledge(coachResponse.relevantKnowledge);
      }

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: coachResponse.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMessage]);

      if (autoSpeak && speechSupported) {
        setTimeout(() => speak(coachResponse.response), 300);
      }

      setIsTranscribing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      setIsTranscribing(false);
    }
  };

  const handleComplete = async () => {
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
      };
      onComplete(currentTranscript, insights);
    }
    handleClose();
  };

  const handleClose = () => {
    cancelSpeech();
    setMessages([]);
    setCurrentTranscript('');
    setError(null);
    onClose();
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
              {isRecording
                ? 'Speak naturally, the coach is listening...'
                : 'Press the microphone to start speaking'}
            </p>
            {messages.length > 1 && !isRecording && !isTranscribing && (
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

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={async () => {
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
                  await startRecording();
                }
              }}
              disabled={isTranscribing}
              className={`
                w-20 h-20 rounded-full
                flex items-center justify-center
                transition-all duration-200
                shadow-lg
                relative
                ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gradient-to-br from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600'
                }
                text-white
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isRecording && (
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
              )}
              {isTranscribing ? (
                <Loader className="w-10 h-10 animate-spin relative z-10" />
              ) : (
                <Mic className="w-10 h-10 relative z-10" />
              )}
            </button>
          </div>

          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-red-700 font-medium">
                  {formatTime(durationSeconds)}
                </span>
              </div>
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
