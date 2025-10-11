import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Clock, Target, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import { useDailyProgress } from '../hooks/useDailyProgress';
import type { Action } from '../lib/database.types';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
  action?: Action;
}

const TIMER_DURATIONS = [
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

export function FocusTimer({ isOpen, onClose, action }: FocusTimerProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { mustTimeRequired, mustTimeCompleted, totalFocusTime, mustTimePercentage, isMustGoalReached, refresh } = useDailyProgress();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(selectedDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousMustGoalState, setPreviousMustGoalState] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (isOpen) {
      if (action?.duration_minutes && !isRunning) {
        const actionDuration = action.duration_minutes;
        setSelectedDuration(actionDuration);
        setTimeLeft(actionDuration * 60);
      } else if (!isRunning) {
        setTimeLeft(selectedDuration * 60);
      }
      setIsRunning(false);
      setStartTime(null);
      setShowCelebration(false);
      setPreviousMustGoalState(isMustGoalReached);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(selectedDuration * 60);
    }
  }, [selectedDuration]);

  const handleComplete = async () => {
    setIsRunning(false);

    if (!user || !organization || !startTime) return;

    try {
      const endTime = new Date();
      const actualMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      const countedAsMust = action?.is_must || false;

      const timeBlock = {
        user_id: user.id,
        organization_id: organization.id,
        action_id: action?.id || null,
        outcome_id: action?.outcome_id || null,
        title: action?.title || 'Focus Session',
        scheduled_start: startTime.toISOString(),
        scheduled_end: endTime.toISOString(),
        actual_start: startTime.toISOString(),
        actual_end: endTime.toISOString(),
        duration_minutes: selectedDuration,
        actual_minutes: actualMinutes,
        completed: true,
        counted_as_must: countedAsMust,
      };

      await supabase.from('time_blocks').insert(timeBlock);

      await refresh();

      if (!previousMustGoalState && isMustGoalReached) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: action ? `Great work on: ${action.title}` : 'Time to take a break!',
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      console.error('Error saving time block:', error);
    }
  };

  const handleStart = () => {
    if (!isRunning) {
      setStartTime(new Date());

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    setStartTime(null);
  };

  const handleDurationChange = (minutes: number) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className={`bg-gradient-to-r p-4 sm:p-6 text-white ${
          action?.is_must ? 'from-orange-500 to-orange-600' : 'from-blue-500 to-blue-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold truncate">Focus Timer</h2>
              {action?.is_must && (
                <span className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-30 rounded text-xs font-semibold">
                  <Flame className="w-3 h-3" />
                  MUST
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          {action && (
            <div className={`flex items-center gap-2 ${
              action.is_must ? 'text-orange-100' : 'text-blue-100'
            }`}>
              <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm truncate">{action.title}</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {showCelebration && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg animate-pulse">
              <div className="flex items-center gap-2 text-green-800">
                <div className="text-2xl">🎉</div>
                <div>
                  <p className="font-bold text-sm sm:text-base">Must Goals Complete!</p>
                  <p className="text-xs sm:text-sm">Keep the momentum going!</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Flame className="w-3 h-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-800">Must Time</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-orange-900">
                {mustTimeCompleted}/{mustTimeRequired} min
              </div>
              <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-orange-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${mustTimePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Total Focus</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-900">
                {totalFocusTime} min
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Today's work
              </div>
            </div>
          </div>
          <div className="relative mb-6 sm:mb-8">
            <svg className="w-full h-48 sm:h-56 lg:h-64" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={action?.is_must ? '#f97316' : '#3b82f6'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                  {selectedDuration} minute session
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4 sm:mb-6">
            {TIMER_DURATIONS.map((duration) => (
              <button
                key={duration.minutes}
                onClick={() => handleDurationChange(duration.minutes)}
                disabled={isRunning}
                className={`py-2 px-2 sm:px-3 rounded-lg font-medium transition-colors text-xs sm:text-sm min-h-touch-target ${
                  selectedDuration === duration.minutes
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleStart}
              className={`flex-1 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-touch-target ${
                action?.is_must
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  {timeLeft === selectedDuration * 60 ? 'Start' : 'Resume'}
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="xs:flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-h-touch-target"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              Reset
            </button>
          </div>

          <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg ${
            action?.is_must ? 'bg-orange-50' : 'bg-blue-50'
          }`}>
            <p className={`text-xs sm:text-sm ${
              action?.is_must ? 'text-orange-800' : 'text-blue-800'
            }`}>
              <strong>Tip:</strong> Close this window to work in full focus mode.
              You'll get a notification when your session is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
