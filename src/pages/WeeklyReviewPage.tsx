import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Target, Star, TrendingUp, Sparkles, Inbox, Clock, Check, ChevronDown, ChevronUp, Target as TargetIcon, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';
import type { InboxItem, Outcome, ReviewSession } from '../lib/database.types';
import { Heart, Briefcase, DollarSign, Users, BookOpen, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';

const ICON_MAP: Record<string, any> = {
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Sparkles,
  Smile,
  Target,
};

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  color_hex?: string;
}

interface TimeBlock {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  actual_minutes?: number;
  completed: boolean;
  notes?: string;
  area?: Area;
}

interface AreaStats {
  area: Area;
  completedBlocks: number;
  totalBlocks: number;
  plannedMinutes: number;
  actualMinutes: number;
}
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { BackgroundHeroSection } from '../components/BackgroundHeroSection';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { usePageBackground } from '../hooks/usePageBackground';

type ReviewStep = 'welcome' | 'inbox' | 'outcomes' | 'purpose' | 'schedule' | 'celebrate' | 'reflection' | 'complete';

export function WeeklyReviewPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [currentStep, setCurrentStep] = useState<ReviewStep>('welcome');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [wins, setWins] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastReviewDate, setLastReviewDate] = useState<string | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [areaStats, setAreaStats] = useState<AreaStats[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState({
    wins: '',
    challenges: '',
    learnings: '',
    nextWeek: '',
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const {
    getBackgroundUrl,
    getBackgroundPosition,
    getOverlayOpacity,
    updateBackground,
    uploadImage,
  } = usePageBackground('weekly-review');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 5 || day === 6;
  };

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization]);

  const loadData = async () => {
    try {
      const { data: inboxData } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select('*, areas(*)')
        .eq('user_id', user?.id)
        .eq('status', 'ACTIVE')
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      const { data: lastReview } = await supabase
        .from('review_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('session_type', 'WEEKLY')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setInboxItems(inboxData || []);
      setOutcomes(outcomesData || []);
      setLastReviewDate(lastReview?.created_at || null);

      const { data: blocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('scheduled_start', weekStart.toISOString())
        .lt('scheduled_start', weekEnd.toISOString())
        .order('scheduled_start');

      const blocksWithAreas = await Promise.all(
        (blocks || []).map(async (block) => {
          if (block.action_id) {
            const { data: action } = await supabase
              .from('actions')
              .select('area_id')
              .eq('id', block.action_id)
              .maybeSingle();

            if (action?.area_id) {
              const { data: area } = await supabase
                .from('areas')
                .select('*')
                .eq('id', action.area_id)
                .maybeSingle();

              return { ...block, area };
            }
          }
          return block;
        })
      );

      setTimeBlocks(blocksWithAreas as TimeBlock[]);
      calculateAreaStats(blocksWithAreas as TimeBlock[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReview = () => {
    if (confirm('Skip this week\'s review? You can always come back later.')) {
      window.location.href = '/today';
    }
  };

  const handleRemindLater = async () => {
    alert('We\'ll remind you again tomorrow!');
    window.location.href = '/today';
  };

  const calculateAreaStats = (blocks: TimeBlock[]) => {
    const areaMap = new Map<string, AreaStats>();

    blocks.forEach(block => {
      if (block.area) {
        const existing = areaMap.get(block.area.id);
        if (existing) {
          existing.totalBlocks++;
          if (block.completed) existing.completedBlocks++;
          existing.plannedMinutes += block.duration_minutes;
          existing.actualMinutes += block.actual_minutes || block.duration_minutes;
        } else {
          areaMap.set(block.area.id, {
            area: block.area,
            completedBlocks: block.completed ? 1 : 0,
            totalBlocks: 1,
            plannedMinutes: block.duration_minutes,
            actualMinutes: block.actual_minutes || block.duration_minutes,
          });
        }
      }
    });

    const stats = Array.from(areaMap.values()).sort((a, b) => b.actualMinutes - a.actualMinutes);
    setAreaStats(stats);
    setExpandedAreas(new Set(stats.map(s => s.area.id)));
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Target;
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const getBlocksForArea = (areaId: string) => {
    return timeBlocks.filter(b => b.area?.id === areaId && b.completed);
  };

  const handleCompleteReview = async () => {
    try {
      const reviewNotes = {
        wins: reflections.wins,
        challenges: reflections.challenges,
        lessons: reflections.learnings,
        nextWeek: reflections.nextWeek,
        top_outcomes: selectedOutcomes,
        inbox_count: inboxItems.length,
      };

      await supabase.from('review_sessions').insert({
        user_id: user?.id,
        organization_id: organization?.id,
        session_type: 'WEEKLY',
        notes: reviewNotes as any,
      });

      setCurrentStep('complete');
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const toggleOutcome = (id: string) => {
    if (selectedOutcomes.includes(id)) {
      setSelectedOutcomes(selectedOutcomes.filter(o => o !== id));
    } else if (selectedOutcomes.length < 5) {
      setSelectedOutcomes([...selectedOutcomes, id]);
    }
  };

  const steps: Record<ReviewStep, number> = {
    welcome: 1,
    inbox: 2,
    outcomes: 3,
    purpose: 4,
    schedule: 5,
    celebrate: 6,
    reflection: 7,
    complete: 8,
  };

  const totalSteps = 7;
  const totalPlannedMinutes = areaStats.reduce((sum, s) => sum + s.plannedMinutes, 0);
  const totalActualMinutes = areaStats.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalCompletedBlocks = areaStats.reduce((sum, s) => sum + s.completedBlocks, 0);
  const totalBlocks = areaStats.reduce((sum, s) => sum + s.totalBlocks, 0);
  const completionRate = totalBlocks > 0 ? Math.round((totalCompletedBlocks / totalBlocks) * 100) : 0;
  const progress = ((steps[currentStep] - 1) / totalSteps) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {currentStep === 'welcome' && (
        <BackgroundHeroSection
          imageUrl={getBackgroundUrl()}
          imagePosition={getBackgroundPosition()}
          overlayOpacity={getOverlayOpacity()}
          height="h-64"
          onEditClick={() => setShowImageModal(true)}
        >
          <div className="text-center text-white px-4">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-5xl font-bold mb-4">Weekly Review</h1>
            <p className="text-xl text-white/90">{weekLabel}</p>
          {lastReviewDate && (
            <p className="text-sm text-primary-200 mb-8">
              Last review: {format(new Date(lastReviewDate), 'MMM d, yyyy')}
            </p>
          )}
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Take 30 minutes to review your week, clear your inbox, choose your top outcomes, and set
            yourself up for success.
          </p>
          <div className="flex gap-4 justify-center">
            {isWeekend() && (
              <button
                onClick={handleRemindLater}
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border-2 border-white/30"
              >
                <Clock className="w-5 h-5 inline mr-2" />
                Remind Me Tomorrow
              </button>
            )}
            <button
              onClick={() => setCurrentStep('inbox')}
              className="px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
            >
              Start Review
            </button>
            <button
              onClick={handleSkipReview}
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border-2 border-white/30"
            >
              Skip This Week
            </button>
          </div>
          </div>
        </BackgroundHeroSection>
      )}

<div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12 space-y-6">
        {currentStep !== 'complete' && currentStep !== 'welcome' && (
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Review Progress</h2>
              <span className="text-sm text-gray-600">
                Step {steps[currentStep]} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

      {currentStep === 'inbox' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Inbox className="w-8 h-8 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Clear Your Inbox</h2>
              <p className="text-gray-600">Process all pending items and convert them to outcomes or archive</p>
            </div>
          </div>

          {inboxItems.length === 0 ? (
            <div className="text-center py-12 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inbox is Clear!</h3>
              <p className="text-gray-600 mb-6">Great job! Your inbox is empty.</p>
              <button
                onClick={() => setCurrentStep('outcomes')}
                className="px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Continue to Outcomes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                <p className="text-amber-800">
                  <strong>{inboxItems.length} items</strong> waiting to be processed. Visit your{' '}
                  <a href="/inbox" className="underline font-semibold">
                    Inbox page
                  </a>{' '}
                  to convert them to outcomes or archive them.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => (window.location.href = '/inbox')}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  Process Inbox Now
                </button>
                <button
                  onClick={() => setCurrentStep('outcomes')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'outcomes' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Top 3-5 Outcomes</h2>
              <p className="text-gray-600">Select the outcomes you want to focus on this week</p>
            </div>
          </div>

          {outcomes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Outcomes</h3>
              <p className="text-gray-600 mb-6">Create outcomes to focus on for the week ahead.</p>
              <button
                onClick={() => (window.location.href = '/outcomes')}
                className="px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Create Outcomes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end mb-2">
                <Link
                  to="/outcomes"
                  className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Outcome
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {outcomes.map((outcome) => {
                  const isSelected = selectedOutcomes.includes(outcome.id);
                  return (
                    <button
                      key={outcome.id}
                      onClick={() => toggleOutcome(outcome.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      disabled={!isSelected && selectedOutcomes.length >= 5}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{outcome.title}</h3>
                          {outcome.purpose && (
                            <p className="text-sm text-gray-600 mt-1 italic">{outcome.purpose}</p>
                          )}
                          {outcome.areas && (
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {outcome.areas.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Selected: {selectedOutcomes.length} of 5</strong>
                  {selectedOutcomes.length === 0 && ' - Choose at least 3 outcomes to continue'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep('inbox')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('purpose')}
                  disabled={selectedOutcomes.length < 3}
                  className="flex-1 px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Purpose Review
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'purpose' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Confirm Your Purposes</h2>
              <p className="text-gray-600">Review why these outcomes matter to you</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {outcomes
              .filter((o) => selectedOutcomes.includes(o.id))
              .map((outcome) => (
                <div key={outcome.id} className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{outcome.title}</h3>
                  <p className="text-gray-700 italic leading-relaxed">
                    <strong>Why:</strong> {outcome.purpose}
                  </p>
                </div>
              ))}
          </div>

          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 mb-6">
            <p className="text-sm text-green-800">
              <strong>Remember:</strong> Your purpose is your fuel. When things get tough this week, come back
              to these reasons.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('outcomes')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('schedule')}
              className="flex-1 px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Continue to Scheduling
            </button>
          </div>
        </div>
      )}

      {currentStep === 'schedule' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Block Your Week</h2>
              <p className="text-gray-600">Schedule time blocks for your top outcomes</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <p className="text-blue-900 mb-4">
                For each outcome, schedule at least one 60-90 minute focused work block this week. Use your
                weekly planner to drag outcomes onto your calendar.
              </p>
              <a
                href="/weekly-plan"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Open Weekly Planner
              </a>
            </div>

            <div className="space-y-2">
              {outcomes
                .filter((o) => selectedOutcomes.includes(o.id))
                .map((outcome) => (
                  <div key={outcome.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Target className="w-5 h-5 text-primary-500" />
                    <span className="text-gray-900 font-medium">{outcome.title}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('purpose')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('celebrate')}
              className="flex-1 px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Continue to Celebration
            </button>
          </div>
        </div>
      )}

      {currentStep === 'celebrate' && (
        <div className="bg-white rounded-2xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Celebrate & Reflect</h2>
              <p className="text-gray-600">Acknowledge your wins and capture lessons learned</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                What were your wins this week?
              </label>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What did you accomplish? What are you proud of?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                What lessons did you learn?
              </label>
              <textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What insights or realizations came up this week?"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setCurrentStep('schedule')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('reflection')}
              className="flex-1 px-8 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
            >
              Continue to Reflection
            </button>
          </div>
        </div>
      )}

      {currentStep === 'reflection' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Week Summary & Reflection</h2>
                <p className="text-gray-600">Review your completed work and reflect on your week</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{totalCompletedBlocks}</div>
                <div className="text-sm text-gray-600">Actions Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">{Math.round(totalActualMinutes / 60)}h</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Actions Completed by Area</h3>
              {areaStats.map(stat => {
                const Icon = getIconComponent(stat.area.icon);
                const color = stat.area.color_hex || stat.area.color;
                const isExpanded = expandedAreas.has(stat.area.id);
                const blocks = getBlocksForArea(stat.area.id);

                return (
                  <div key={stat.area.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleArea(stat.area.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900">{stat.area.name}</h4>
                        <p className="text-sm text-gray-600">
                          {stat.completedBlocks} of {stat.totalBlocks} actions • {Math.round(stat.actualMinutes / 60)}h {stat.actualMinutes % 60}m
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && blocks.length > 0 && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <ul className="space-y-2">
                          {blocks.map(block => (
                            <li key={block.id} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-900">{block.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What were my biggest wins this week?
                </label>
                <textarea
                  value={reflections.wins}
                  onChange={(e) => setReflections({ ...reflections, wins: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Celebrate your achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What challenges did I face?
                </label>
                <textarea
                  value={reflections.challenges}
                  onChange={(e) => setReflections({ ...reflections, challenges: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="What obstacles came up..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What did I learn?
                </label>
                <textarea
                  value={reflections.learnings}
                  onChange={(e) => setReflections({ ...reflections, learnings: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Key insights and lessons..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What will I focus on next week?
                </label>
                <textarea
                  value={reflections.nextWeek}
                  onChange={(e) => setReflections({ ...reflections, nextWeek: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Looking ahead..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setCurrentStep('celebrate')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCompleteReview}
                className="flex-1 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg"
              >
                Complete Weekly Review
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-12 text-white text-center shadow-soft-lg">
          <CheckCircle2 className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Review Complete!</h1>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Excellent work! You've set yourself up for a successful week. Your top outcomes are clear,
            your purposes are strong, and you're ready to make progress.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/today"
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-lg"
            >
              Go to Today
            </a>
            <a
              href="/weekly-plan"
              className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors border-2 border-white/30"
            >
              View Weekly Plan
            </a>
          </div>
        </div>
      )}
      </div>

      {showImageModal && (
        <ImageUploadModal
          currentImageUrl={getBackgroundUrl()}
          currentPosition={getBackgroundPosition()}
          currentOpacity={getOverlayOpacity()}
          onSave={updateBackground}
          onUpload={uploadImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}
