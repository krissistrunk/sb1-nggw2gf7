import { useState } from 'react';
import { Sparkles, Package, Loader2, X, Check } from 'lucide-react';
import { aiService, AIChunkSuggestions as ChunkSuggestionsType } from '../lib/ai-service';

interface AIChunkSuggestionsProps {
  inboxItems: any[];
  onChunksCreated?: (suggestions: ChunkSuggestionsType) => void;
}

export function AIChunkSuggestions({ inboxItems, onChunksCreated }: AIChunkSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChunkSuggestionsType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.suggestChunks(inboxItems);
      setSuggestions(result);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
      console.error('Error getting chunk suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestions && onChunksCreated) {
      onChunksCreated(suggestions);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleGetSuggestions}
        disabled={loading || inboxItems.length < 2}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI Suggest Chunks
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {isOpen && suggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI Chunking Suggestions</h2>
                  <p className="text-sm text-gray-600">Organize your inbox items into meaningful groups</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {suggestions.overall_advice && (
              <div className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <h3 className="font-semibold text-indigo-900 mb-2">AI Recommendation</h3>
                <p className="text-sm text-indigo-800">{suggestions.overall_advice}</p>
              </div>
            )}

            <div className="space-y-4">
              {suggestions.suggested_chunks.map((chunk, index) => (
                <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{chunk.name}</h3>
                        {chunk.should_convert && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Convert to Outcome
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{chunk.description}</p>
                      <p className="text-xs text-gray-600 italic mb-2">{chunk.reasoning}</p>
                      <div className="text-xs text-gray-500">
                        Items: {chunk.item_indices.map(i => inboxItems[i]?.content.substring(0, 30)).join(', ')}...
                      </div>
                      {chunk.suggested_outcome_title && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-xs font-semibold text-green-900">
                            Suggested Outcome: {chunk.suggested_outcome_title}
                          </p>
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
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all"
              >
                Create These Chunks
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
