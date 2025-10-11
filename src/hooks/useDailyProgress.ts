import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface DailyProgress {
  mustTimeRequired: number;
  mustTimeCompleted: number;
  totalFocusTime: number;
  mustTimePercentage: number;
  isMustGoalReached: boolean;
  loading: boolean;
}

export function useDailyProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DailyProgress>({
    mustTimeRequired: 0,
    mustTimeCompleted: 0,
    totalFocusTime: 0,
    mustTimePercentage: 0,
    isMustGoalReached: false,
    loading: true,
  });

  const calculateProgress = async () => {
    if (!user) {
      setProgress({
        mustTimeRequired: 0,
        mustTimeCompleted: 0,
        totalFocusTime: 0,
        mustTimePercentage: 0,
        isMustGoalReached: false,
        loading: false,
      });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: mustActions } = await supabase
        .from('actions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .eq('is_must', true)
        .eq('done', false);

      const mustTimeRequired = mustActions?.reduce((sum, action) => sum + (action.duration_minutes || 0), 0) || 0;

      const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('duration_minutes, actual_minutes, counted_as_must, completed')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('completed', true);

      const mustTimeCompleted = timeBlocks
        ?.filter(block => block.counted_as_must)
        .reduce((sum, block) => sum + (block.actual_minutes || block.duration_minutes || 0), 0) || 0;

      const totalFocusTime = timeBlocks
        ?.reduce((sum, block) => sum + (block.actual_minutes || block.duration_minutes || 0), 0) || 0;

      const mustTimePercentage = mustTimeRequired > 0 ? Math.min((mustTimeCompleted / mustTimeRequired) * 100, 100) : 0;
      const isMustGoalReached = mustTimeRequired > 0 && mustTimeCompleted >= mustTimeRequired;

      setProgress({
        mustTimeRequired,
        mustTimeCompleted,
        totalFocusTime,
        mustTimePercentage,
        isMustGoalReached,
        loading: false,
      });
    } catch (error) {
      console.error('Error calculating daily progress:', error);
      setProgress(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    calculateProgress();
  }, [user]);

  return { ...progress, refresh: calculateProgress };
}
