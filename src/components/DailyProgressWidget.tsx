import { Flame, TrendingUp, Clock } from 'lucide-react';
import { useDailyProgress } from '../hooks/useDailyProgress';

export function DailyProgressWidget() {
  const {
    mustTimeRequired,
    mustTimeCompleted,
    totalFocusTime,
    mustTimePercentage,
    isMustGoalReached,
    loading,
  } = useDailyProgress();

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg sm:rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Must Time Goal</span>
          </div>
          <div className="mb-3">
            <div className="text-2xl sm:text-3xl font-bold text-orange-900">
              {mustTimeCompleted}
              <span className="text-lg sm:text-xl text-orange-700"> / {mustTimeRequired}</span>
              <span className="text-sm sm:text-base text-orange-700 ml-1">min</span>
            </div>
            {isMustGoalReached && (
              <div className="mt-2 flex items-center gap-1 text-green-700 text-xs sm:text-sm font-semibold">
                <span>✓</span>
                <span>Goal Reached!</span>
              </div>
            )}
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-700 ease-out ${
                isMustGoalReached ? 'bg-green-500' : 'bg-orange-600'
              }`}
              style={{ width: `${Math.min(mustTimePercentage, 100)}%` }}
            />
          </div>
          {mustTimeRequired > 0 && (
            <div className="mt-2 text-xs text-orange-700">
              {Math.round(mustTimePercentage)}% complete
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg sm:rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Focus Time</span>
          </div>
          <div className="mb-3">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900">
              {totalFocusTime}
              <span className="text-sm sm:text-base text-blue-700 ml-1">min</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">All productive work today</p>
          </div>
          {totalFocusTime > mustTimeRequired && mustTimeRequired > 0 && (
            <div className="mt-2 px-2 py-1 bg-blue-200 rounded text-xs text-blue-900 font-medium inline-block">
              +{totalFocusTime - mustTimeRequired} min bonus
            </div>
          )}
        </div>
      </div>

      {mustTimeRequired === 0 && (
        <div className="mt-3 text-center text-sm text-gray-500">
          No must actions scheduled for today
        </div>
      )}
    </div>
  );
}
