import { useState, useEffect, useRef } from 'react';
import { Save, X, Tag, Link as LinkIcon, Type } from 'lucide-react';
import { knowledgeService, type KnowledgeNote } from '../lib/knowledge-service';
import { useKnowledge } from '../hooks/useKnowledge';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';

interface NoteEditorProps {
  note?: KnowledgeNote | null;
  onSave: (note: KnowledgeNote) => void;
  onCancel: () => void;
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const { tags, createTag, addTagToNote } = useKnowledge();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [noteType, setNoteType] = useState(note?.note_type || 'fleeting');
  const [selectedTags, setSelectedTags] = useState<string[]>(note?.metadata?.tags || []);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [wikiLinks, setWikiLinks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setNoteType(note.note_type);
      setSelectedTags(note.metadata?.tags || []);
    }
  }, [note]);

  useEffect(() => {
    const links = knowledgeService.parseWikiLinks(content);
    setWikiLinks(links);
  }, [content]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!user || !organization) {
      alert('Please sign in to save notes');
      return;
    }

    setSaving(true);
    try {
      const noteData: any = {
        title: title.trim(),
        content: content.trim(),
        note_type: noteType,
        metadata: {
          tags: selectedTags,
        },
      };

      let savedNote;
      if (note?.id) {
        savedNote = await knowledgeService.updateNote(note.id, noteData);
      } else {
        savedNote = await knowledgeService.createNote({
          ...noteData,
          source_type: 'manual',
          user_id: user.id,
          organization_id: organization.id,
        });
      }

      if (content.trim()) {
        await knowledgeService.generateEmbedding(savedNote.id, title + '\n\n' + content);
      }

      onSave(savedNote);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const insertWikiLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const linkText = selectedText || 'note title';
    const newContent = content.substring(0, start) + `[[${linkText}]]` + content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + 2;
      textarea.setSelectionRange(cursorPos, cursorPos + linkText.length);
    }, 0);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const existingTag = tags.find((t) => t.tag_name === newTagName.trim());
      if (existingTag) {
        setSelectedTags((prev) => [...new Set([...prev, newTagName.trim()])]);
      } else {
        await createTag(newTagName.trim());
        setSelectedTags((prev) => [...prev, newTagName.trim()]);
      }
      setNewTagName('');
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const removeTag = (tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName));
  };

  const noteTypes = [
    { value: 'fleeting', label: 'Fleeting', description: 'Quick capture' },
    { value: 'permanent', label: 'Permanent', description: 'Refined knowledge' },
    { value: 'literature', label: 'Literature', description: 'From reading' },
    { value: 'insight', label: 'Insight', description: 'Key realization' },
    { value: 'pattern', label: 'Pattern', description: 'Recurring theme' },
    { value: 'learning', label: 'Learning', description: 'Lesson learned' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          {note ? 'Edit Note' : 'Create Note'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter note title..."
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {noteTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setNoteType(type.value as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  noteType === type.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={type.description}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <button
              onClick={insertWikiLink}
              className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Insert Link
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="Write your note... Use [[note title]] to link to other notes."
          />
          {wikiLinks.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Wiki links found: {wikiLinks.map((l) => l.noteTitle).join(', ')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tagName) => (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tagName}
                <button
                  onClick={() => removeTag(tagName)}
                  className="ml-1 hover:text-primary-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add tag..."
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}
