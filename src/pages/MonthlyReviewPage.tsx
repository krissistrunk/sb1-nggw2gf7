import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Target, CheckCircle, XCircle, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { Outcome, Action, Goal, TimeBlock } from '../lib/database.types';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';
import { OUTCOME_STATUS } from '../constants/status';

export function MonthlyReviewPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [reflections, setReflections] = useState({
    wins: '',
    challenges: '',
    lessons: '',
    nextMonthFocus: '',
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('monthly-review');

  useEffect(() => {
    loadMonthData();
  }, [user, organization, currentDate]);

  const loadMonthData = async () => {
    if (!user || !organization) return;

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const [outcomesResult, actionsResult, goalsResult, timeBlocksResult] = await Promise.all([
        supabase
          .from('outcomes')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .or(`created_at.gte.${startOfMonth},completed_at.gte.${startOfMonth}`)
          .lte('created_at', endOfMonth),
        supabase
          .from('actions')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .gte('scheduled_date', startOfMonth.split('T')[0])
          .lte('scheduled_date', endOfMonth.split('T')[0]),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .eq('year', year),
        supabase
          .from('time_blocks')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .gte('start_time', startOfMonth)
          .lte('start_time', endOfMonth)
          .eq('completed', true)
      ]);

      setOutcomes(outcomesResult.data || []);
      setActions(actionsResult.data || []);
      setGoals(goalsResult.data || []);
      setTimeBlocks(timeBlocksResult.data || []);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const thisMonth = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const completedActions = actions.filter((a: any) => a.status === 'COMPLETED' || a.done);
  const completedOutcomes = outcomes.filter(o => o.status === OUTCOME_STATUS.COMPLETED);
  const totalFocusMinutes = timeBlocks.reduce((sum, block) => sum + block.duration_minutes, 0);
  const totalFocusHours = Math.round(totalFocusMinutes / 60);
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length)
    : 0;

  const completionRate = actions.length > 0
    ? Math.round((completedActions.length / actions.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading monthly review...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-500" />
          Monthly Review
        </h1>
        <p className="text-gray-600">
          Reflect on your progress and plan for the month ahead
        </p>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
          <button
            onClick={thisMonth}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
          >
            Current Month
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-gray-900">{completedActions.length}</span>
          </div>
          <div className="text-sm text-gray-600">Actions Completed</div>
          <div className="mt-2 text-xs text-gray-500">
            {completionRate}% completion rate
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-gray-900">{completedOutcomes.length}</span>
          </div>
          <div className="text-sm text-gray-600">Outcomes Achieved</div>
          <div className="mt-2 text-xs text-gray-500">
            of {outcomes.length} total outcomes
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <span className="text-3xl font-bold text-gray-900">{avgGoalProgress}%</span>
          </div>
          <div className="text-sm text-gray-600">Average Goal Progress</div>
          <div className="mt-2 text-xs text-gray-500">
            across {goals.length} goals
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-gray-900">{totalFocusHours}h</span>
          </div>
          <div className="text-sm text-gray-600">Focus Time</div>
          <div className="mt-2 text-xs text-gray-500">
            {timeBlocks.length} sessions completed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Key Wins & Achievements
          </h3>
          <textarea
            value={reflections.wins}
            onChange={(e) => setReflections({ ...reflections, wins: e.target.value })}
            placeholder="What were your biggest wins this month? What are you proud of accomplishing?"
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Challenges & Obstacles
          </h3>
          <textarea
            value={reflections.challenges}
            onChange={(e) => setReflections({ ...reflections, challenges: e.target.value })}
            placeholder="What challenges did you face? What got in the way of your progress?"
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Lessons Learned
          </h3>
          <textarea
            value={reflections.lessons}
            onChange={(e) => setReflections({ ...reflections, lessons: e.target.value })}
            placeholder="What did you learn this month? How will you apply these insights?"
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Next Month Focus
          </h3>
          <textarea
            value={reflections.nextMonthFocus}
            onChange={(e) => setReflections({ ...reflections, nextMonthFocus: e.target.value })}
            placeholder="What will you focus on next month? What are your top priorities?"
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {goals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Goal Progress
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <span className="text-sm font-semibold text-blue-600">
                    {goal.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Monthly Review Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Be honest about both successes and challenges</li>
          <li>• Look for patterns in what works and what doesn't</li>
          <li>• Celebrate small wins along with big achievements</li>
          <li>• Use insights to adjust your approach for next month</li>
          <li>• Review your goals and outcomes to ensure alignment</li>
        </ul>
      </div>
    </div>
  );
}
