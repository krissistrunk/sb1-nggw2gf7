import { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Tag,
  Calendar,
  FileText,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Network,
  Download,
  Upload,
  MoreVertical,
} from 'lucide-react';
import { useKnowledge } from '../hooks/useKnowledge';
import { NoteEditor } from '../components/NoteEditor';
import type { KnowledgeNote } from '../lib/knowledge-service';
import { knowledgeService } from '../lib/knowledge-service';
import { useNavigate } from 'react-router-dom';

export function KnowledgeBasePage() {
  const navigate = useNavigate();
  const { notes, tags, loading, searchNotes, loadNotes } = useKnowledge();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchNotes(searchQuery);
    } else {
      loadNotes();
    }
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note: KnowledgeNote) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = (note: KnowledgeNote) => {
    setShowEditor(false);
    setSelectedNote(null);
    loadNotes();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const files = await knowledgeService.exportAsMarkdown();

      for (const file of files) {
        const blob = new Blob([file.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export notes');
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files) as File[];

      for (const file of files) {
        try {
          const content = await file.text();
          const title = file.name.replace('.md', '').replace(/-/g, ' ');

          await knowledgeService.createNote({
            title,
            content,
            note_type: 'fleeting',
            source_type: 'manual',
            metadata: { imported: true },
          });
        } catch (error) {
          console.error(`Failed to import ${file.name}:`, error);
        }
      }

      loadNotes();
      setShowMenu(false);
      alert(`Imported ${files.length} note(s)`);
    };
    input.click();
  };

  const filteredNotes = notes.filter((note) => {
    if (selectedType && note.note_type !== selectedType) return false;
    if (selectedTag && !note.metadata?.tags?.includes(selectedTag)) return false;
    return true;
  });

  const noteTypeIcons: any = {
    fleeting: FileText,
    permanent: BookOpen,
    insight: Lightbulb,
    pattern: TrendingUp,
    learning: Brain,
    literature: BookOpen,
  };

  const noteTypeColors: any = {
    fleeting: 'bg-gray-100 text-gray-700',
    permanent: 'bg-blue-100 text-blue-700',
    insight: 'bg-yellow-100 text-yellow-700',
    pattern: 'bg-purple-100 text-purple-700',
    learning: 'bg-green-100 text-green-700',
    literature: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
                <p className="text-gray-600 mt-1">Your personal second brain</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/knowledge-graph')}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <Network className="w-5 h-5" />
                View Graph
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {exporting ? 'Exporting...' : 'Export to Obsidian'}
                    </button>
                    <button
                      onClick={handleImport}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Import from Obsidian
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New Note
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Notes</div>
              <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Tags</div>
              <div className="text-2xl font-bold text-gray-900">{tags.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Insights</div>
              <div className="text-2xl font-bold text-gray-900">
                {notes.filter((n) => n.note_type === 'insight').length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Patterns</div>
              <div className="text-2xl font-bold text-gray-900">
                {notes.filter((n) => n.note_type === 'pattern').length}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Search
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="fleeting">Fleeting</option>
                <option value="permanent">Permanent</option>
                <option value="insight">Insight</option>
                <option value="pattern">Pattern</option>
                <option value="learning">Learning</option>
                <option value="literature">Literature</option>
              </select>

              {tags.length > 0 && (
                <select
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.tag_name}>
                      {tag.tag_name} ({tag.note_count})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="text-gray-600 mt-4">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">Start building your knowledge base</p>
            <button
              onClick={handleCreateNote}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create First Note
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }
          >
            {filteredNotes.map((note) => {
              const Icon = noteTypeIcons[note.note_type] || FileText;
              return (
                <div
                  key={note.id}
                  onClick={() => handleEditNote(note)}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          noteTypeColors[note.note_type]
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{note.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {note.content || 'No content'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.metadata?.tags?.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onCancel={() => {
                setShowEditor(false);
                setSelectedNote(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
