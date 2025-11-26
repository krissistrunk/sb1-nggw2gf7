import { Mic, MicOff, Loader } from 'lucide-react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

interface VoiceCoachButtonProps {
  onRecordingComplete: (audioUrl: string, blob: Blob, durationSeconds: number) => void | Promise<void>;
  onError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  maxDurationSeconds?: number;
}

export function VoiceCoachButton({
  onRecordingComplete,
  onError,
  size = 'md',
  variant = 'primary',
  className = '',
  maxDurationSeconds = 300,
}: VoiceCoachButtonProps) {
  const {
    state,
    error,
    durationSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    isProcessing,
  } = useVoiceRecording({ maxDurationSeconds });

  const handleClick = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await onRecordingComplete(result.audioUrl, result.blob, result.durationSeconds);
      }
    } else if (!isProcessing) {
      const success = await startRecording();
      if (!success && error && onError) {
        onError(error);
      }
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelRecording();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const variantClasses = {
    primary: isRecording
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: isRecording
      ? 'bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-300'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300',
    ghost: isRecording
      ? 'bg-red-50 hover:bg-red-100 text-red-600'
      : 'bg-transparent hover:bg-gray-100 text-gray-600',
  };

  if (state === 'error' && error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <MicOff className={iconSizeClasses[size]} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg
          relative
          ${className}
        `}
        title={
          isRecording
            ? 'Stop recording'
            : isProcessing
            ? 'Processing...'
            : 'Start voice recording'
        }
      >
        {isProcessing ? (
          <Loader className={`${iconSizeClasses[size]} animate-spin`} />
        ) : isRecording ? (
          <>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <Mic className={`${iconSizeClasses[size]} relative z-10`} />
          </>
        ) : (
          <Mic className={iconSizeClasses[size]} />
        )}
      </button>

      {isRecording && (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-red-700 font-medium">
              {formatTime(durationSeconds)}
            </span>
            <span className="text-xs text-red-600">
              / {formatTime(maxDurationSeconds)}
            </span>
          </div>

          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel recording"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'requesting_permission' && (
        <span className="text-sm text-gray-600">Requesting microphone access...</span>
      )}
    </div>
  );
}
