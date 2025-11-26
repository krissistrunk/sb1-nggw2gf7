import { useState, useEffect } from 'react';
import { Network, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
import { useKnowledge } from '../hooks/useKnowledge';

export function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const { getGraphData } = useKnowledge();
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGraphData();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleNodeClick = (nodeId: string) => {
    navigate(`/knowledge?note=${nodeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/knowledge')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Network className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Knowledge Graph</h1>
                <p className="text-gray-600 mt-1">Visualize your network of insights</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load graph</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadGraph}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">How to Use</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Click and drag to pan around the graph</li>
                <li>• Use mouse wheel to zoom in/out</li>
                <li>• Click on any note to view its details</li>
                <li>• Larger nodes have more connections (more important)</li>
                <li>• Different colors represent different note types</li>
                <li>• Animated edges show "leads to" relationships</li>
              </ul>
            </div>

            <KnowledgeGraphView
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleNodeClick}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}
