import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Loader, Maximize2, Minimize2, Filter } from 'lucide-react';

interface KnowledgeGraphViewProps {
  nodes: any[];
  edges: any[];
  onNodeClick?: (nodeId: string) => void;
  loading?: boolean;
}

const nodeTypeColors: Record<string, string> = {
  fleeting: '#9ca3af',
  permanent: '#3b82f6',
  insight: '#eab308',
  pattern: '#a855f7',
  learning: '#10b981',
  literature: '#ec4899',
};

const edgeTypeColors: Record<string, string> = {
  relates_to: '#6b7280',
  contradicts: '#ef4444',
  supports: '#10b981',
  example_of: '#8b5cf6',
  caused_by: '#f59e0b',
  leads_to: '#3b82f6',
};

export function KnowledgeGraphView({ nodes, edges, onNodeClick, loading }: KnowledgeGraphViewProps) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    const layout = generateLayout(nodes, edges);

    const reactFlowNodes: Node[] = layout.nodes.map((node: any) => ({
      id: node.id,
      type: 'default',
      position: node.position,
      data: {
        label: node.label,
      },
      style: {
        background: nodeTypeColors[node.type] || '#6b7280',
        color: '#ffffff',
        border: '2px solid #ffffff',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: '600',
        width: Math.max(150, Math.min(node.size * 15, 300)),
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
    }));

    const reactFlowEdges: Edge[] = layout.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.type === 'leads_to',
      style: {
        stroke: edgeTypeColors[edge.type] || '#6b7280',
        strokeWidth: edge.strength / 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeTypeColors[edge.type] || '#6b7280',
      },
    }));

    setFlowNodes(reactFlowNodes);
    setFlowEdges(reactFlowEdges);
  }, [nodes, edges]);

  const generateLayout = (nodes: any[], edges: any[]) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 250;

    const layoutNodes = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const adjustedRadius = radius + (node.size || 10) * 5;

      return {
        ...node,
        position: {
          x: centerX + adjustedRadius * Math.cos(angle),
          y: centerY + adjustedRadius * Math.sin(angle),
        },
      };
    });

    return {
      nodes: layoutNodes,
      edges,
    };
  };

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  const filteredNodes = selectedType
    ? flowNodes.filter((node) => {
        const originalNode = nodes.find((n) => n.id === node.id);
        return originalNode?.type === selectedType;
      })
    : flowNodes;

  const filteredEdges = selectedType
    ? flowEdges.filter((edge) => {
        return filteredNodes.some((n) => n.id === edge.source) &&
               filteredNodes.some((n) => n.id === edge.target);
      })
    : flowEdges;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-xl">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-2">No notes yet</p>
          <p className="text-gray-500 text-sm">Create notes and links to see your knowledge graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-[600px]'} rounded-xl border border-gray-200 overflow-hidden`}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />

        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Type</span>
          </div>
          <select
            value={selectedType || ''}
            onChange={(e) => setSelectedType(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="fleeting">Fleeting</option>
            <option value="permanent">Permanent</option>
            <option value="insight">Insight</option>
            <option value="pattern">Pattern</option>
            <option value="learning">Learning</option>
            <option value="literature">Literature</option>
          </select>

          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
            <div className="space-y-1">
              {Object.entries(nodeTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-600 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </button>
        </Panel>

        <Panel position="bottom-center" className="bg-white/90 backdrop-blur rounded-lg shadow px-4 py-2 text-sm text-gray-600">
          {flowNodes.length} notes • {flowEdges.length} connections
        </Panel>
      </ReactFlow>
    </div>
  );
}
