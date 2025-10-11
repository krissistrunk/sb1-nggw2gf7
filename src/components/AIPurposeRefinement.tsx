import { useState } from 'react';
import { Sparkles, X, Check, Loader2, Lightbulb } from 'lucide-react';
import { aiService, AIPurposeRefinement as PurposeRefinementType } from '../lib/ai-service';

interface AIPurposeRefinementProps {
  title: string;
  currentPurpose: string;
  context?: string;
  onPurposeUpdated: (newPurpose: string) => void;
}

export function AIPurposeRefinement({ title, currentPurpose, context, onPurposeUpdated }: AIPurposeRefinementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refinement, setRefinement] = useState<PurposeRefinementType | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleRefine = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.refinePurpose(title, currentPurpose, context);
      setRefinement(result);
      setSelectedPurpose(result.refined);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine purpose');
      console.error('Error refining purpose:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (selectedPurpose) {
      onPurposeUpdated(selectedPurpose);
      setIsOpen(false);
      setRefinement(null);
    }
  };

  return (
    <>
      <button
        onClick={handleRefine}
        disabled={loading || !currentPurpose.trim()}
        className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Get AI suggestions to improve your purpose statement"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Refining...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Refine Purpose
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isOpen && refinement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Purpose Refinement Suggestions</h2>
                  <p className="text-sm text-gray-600">Select the version that resonates most with you</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Purpose</h3>
              <p className="text-gray-900 italic">{currentPurpose}</p>
            </div>

            {refinement.feedback && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">AI Feedback</h3>
                    <p className="text-sm text-blue-800">{refinement.feedback}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div
                onClick={() => setSelectedPurpose(refinement.refined)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPurpose === refinement.refined
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    selectedPurpose === refinement.refined
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPurpose === refinement.refined && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">Main Refinement</h3>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-gray-900 italic">{refinement.refined}</p>
                  </div>
                </div>
              </div>

              {refinement.alternatives.map((alt, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPurpose(alt.text)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPurpose === alt.text
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      selectedPurpose === alt.text
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPurpose === alt.text && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">{alt.tone} Version</h3>
                      </div>
                      <p className="text-gray-900 italic mb-2">{alt.text}</p>
                      <p className="text-xs text-gray-600">{alt.rationale}</p>
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
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!selectedPurpose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Selected Purpose
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
