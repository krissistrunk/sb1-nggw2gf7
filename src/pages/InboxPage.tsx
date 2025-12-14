import { useState, useEffect } from 'react';
import { Inbox, Plus, X, ArrowRight, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../contexts/OrganizationContext';

interface InboxItem {
  id: string;
  content: string;
  item_type: 'NOTE' | 'ACTION_IDEA' | 'OUTCOME_IDEA';
  triaged: boolean;
  created_at: string;
}

interface Outcome {
  id: string;
  title: string;
}

export function InboxPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingItem, setConvertingItem] = useState<InboxItem | null>(null);
  const [formData, setFormData] = useState({
    content: '',
  });
  const [selectedOutcome, setSelectedOutcome] = useState('');

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization]);

  const loadData = async () => {
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      const { data: itemsData } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('triaged', false)
        .order('created_at', { ascending: false });

      const { data: outcomesData } = await supabase
        .from('outcomes')
        .select('id, title')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE')
        .order('title');

      setItems(itemsData || []);
      setOutcomes(outcomesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = user?.id;
    const organizationId = organization?.id;
    if (!userId || !organizationId) return;

    try {
      await supabase.from('inbox_items').insert({
        user_id: userId,
        organization_id: organizationId,
        content: formData.content,
        item_type: 'NOTE',
        triaged: false,
      });

      setShowModal(false);
      setFormData({ content: '' });
      loadData();
    } catch (error) {
      console.error('Error saving inbox item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await supabase.from('inbox_items').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openConvertModal = (item: InboxItem) => {
    setConvertingItem(item);
    setSelectedOutcome(outcomes[0]?.id || '');
    setShowConvertModal(true);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingItem) return;
    const userId = user?.id;
    if (!userId) return;

    try {
      await supabase.from('actions').insert({
        user_id: userId,
        outcome_id: selectedOutcome,
        title: convertingItem.content,
      });

      await supabase
        .from('inbox_items')
        .update({ triaged: true })
        .eq('id', convertingItem.id);

      setShowConvertModal(false);
      setConvertingItem(null);
      setSelectedOutcome('');
      loadData();
    } catch (error) {
      console.error('Error converting item:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600 mt-1">Capture ideas and triage them into outcomes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Quick Capture
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-soft">
          <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Inbox Zero</h3>
          <p className="text-gray-600 mb-6">All caught up! Add new ideas as they come to you.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Capture Idea
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 mb-2">{item.content}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.item_type === 'OUTCOME_IDEA' ? 'bg-blue-100 text-blue-700' :
                      item.item_type === 'ACTION_IDEA' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.item_type === 'OUTCOME_IDEA' ? 'Outcome' :
                       item.item_type === 'ACTION_IDEA' ? 'Action' : 'Note'}
                    </span>
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openConvertModal(item)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Convert to action"
                    disabled={outcomes.length === 0}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quick Capture</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's on your mind?</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Call John about project"
                  rows={3}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  Capture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConvertModal && convertingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConvertModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Convert to Action</h2>
              <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium text-gray-900">{convertingItem.content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which outcome does this support?
                </label>
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {outcomes.map((outcome) => (
                    <option key={outcome.id} value={outcome.id}>
                      {outcome.title}
                    </option>
                  ))}
                </select>
                {outcomes.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No outcomes yet.{' '}
                    <a href="/outcomes" className="text-primary-600 hover:text-primary-700">
                      Create one first
                    </a>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                  disabled={outcomes.length === 0}
                >
                  Convert to Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
