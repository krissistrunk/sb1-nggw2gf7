import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, User, Clock, Calendar, Check, X, Flame } from 'lucide-react';
import type { Action } from '../lib/database.types';

interface SortableActionItemProps {
  action: Action;
  isEditing: boolean;
  editActionTitle: string;
  editActionDuration: number;
  editActionDelegatedTo: string;
  onToggleAction: (action: Action) => void;
  onStartEdit: (action: Action) => void;
  onSaveEdit: (actionId: string) => void;
  onCancelEdit: () => void;
  onDelete: (actionId: string) => void;
  setEditActionTitle: (value: string) => void;
  setEditActionDuration: (value: number) => void;
  setEditActionDelegatedTo: (value: string) => void;
  getPriorityColor?: (priority: number) => string;
}

export function SortableActionItem({
  action,
  isEditing,
  editActionTitle,
  editActionDuration,
  editActionDelegatedTo,
  onToggleAction,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  setEditActionTitle,
  setEditActionDuration,
  setEditActionDelegatedTo,
}: SortableActionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDelegated = !!action.delegated_to;

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-start gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-300"
      >
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={editActionTitle}
            onChange={(e) => setEditActionTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Action title"
            autoFocus
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={editActionDuration}
                onChange={(e) => setEditActionDuration(parseInt(e.target.value) || 30)}
                min="5"
                max="480"
                step="5"
                className="w-16 bg-transparent focus:outline-none"
              />
              <span className="text-sm text-gray-600">min</span>
            </div>
            <input
              type="text"
              value={editActionDelegatedTo}
              onChange={(e) => setEditActionDelegatedTo(e.target.value)}
              placeholder="Delegate to (optional)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSaveEdit(action.id)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-0.5"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <button
        onClick={() => onToggleAction(action)}
        className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5 hover:border-primary-500 transition-colors"
      />
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <p className="text-gray-900 font-medium flex-1">{action.title}</p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onStartEdit(action)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(action.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {action.notes && (
          <p className="text-sm text-gray-600 mb-2">{action.notes}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{action.duration_minutes || 60} min</span>
          </div>
          {isDelegated && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              <User className="w-3 h-3" />
              <span>{action.delegated_to}</span>
            </div>
          )}
          {action.is_must && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
              <Flame className="w-3 h-3" />
              <span>Must Do</span>
            </div>
          )}
          {action.scheduled_date && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(action.scheduled_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
