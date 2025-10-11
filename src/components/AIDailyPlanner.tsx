import { useState } from 'react';
import { Sparkles, Target, Loader2, X, Check } from 'lucide-react';
import { aiService, AIDailyPlan } from '../lib/ai-service';

interface AIDailyPlannerProps {
  outcomes: any[];
  actions: any[];
  completionHistory?: { rate: number };
  onRecommendationAccepted?: (outcomeIds: string[]) => void;
}

export function AIDailyPlanner({ outcomes, actions, completionHistory, onRecommendationAccepted }: AIDailyPlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIDailyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateDailyPlan(outcomes, actions, completionHistory);
      setPlan(result);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      console.error('Error generating daily plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPlan = () => {
    if (plan && onRecommendationAccepted) {
      const outcomeIds = plan.recommendations.map(r => r.outcome_id);
      onRecommendationAccepted(outcomeIds);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleGeneratePlan}
        disabled={loading || outcomes.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Planning...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI Daily Plan
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isOpen && plan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your AI Daily Plan</h2>
                  <p className="text-sm text-gray-600">Focus on these outcomes today</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {plan.overall_strategy && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Today's Strategy</h3>
                <p className="text-sm text-green-800">{plan.overall_strategy}</p>
              </div>
            )}

            <div className="space-y-4">
              {plan.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">{rec.outcome_title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          rec.priority === 1 ? 'bg-red-100 text-red-700' :
                          rec.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          Priority {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{rec.reasoning}</p>
                      {rec.suggested_actions && rec.suggested_actions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Suggested Actions:</p>
                          <ul className="space-y-1">
                            {rec.suggested_actions.map((action, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleAcceptPlan}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all"
              >
                Focus on These
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
