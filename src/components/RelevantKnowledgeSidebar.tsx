import { Brain, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RelevantNote {
  id: string;
  title: string;
  created_at: string;
}

interface RelevantKnowledgeSidebarProps {
  notes: RelevantNote[];
  isVisible: boolean;
}

export function RelevantKnowledgeSidebar({ notes, isVisible }: RelevantKnowledgeSidebarProps) {
  const navigate = useNavigate();

  if (!isVisible || notes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Relevant Past Insights</h3>
          <p className="text-xs text-gray-600">From your knowledge base</p>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => navigate('/knowledge')}
            className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-all border border-purple-100 hover:border-purple-300 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {note.title}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-purple-200">
        <p className="text-xs text-gray-600 italic">
          The coach is aware of these insights and may reference them naturally in the conversation.
        </p>
      </div>
    </div>
  );
}
