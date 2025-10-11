import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2, Clock, Flame, User, Trash2 } from 'lucide-react';
import type { Action } from '../lib/database.types';

interface DraggableActionItemProps {
  action: Action;
  isSelected: boolean;
  isMust: boolean;
  isEditing: boolean;
  isDelegated: boolean;
  editActionTitle: string;
  editActionDuration: number;
  editActionDelegatedTo: string;
  onToggleAction: (actionId: string) => void;
  onToggleMust: (actionId: string) => void;
  onStartEdit: (action: Action) => void;
  onSaveEdit: (actionId: string, outcomeId: string) => void;
  onCancelEdit: () => void;
  onDelete: (actionId: string, outcomeId: string) => void;
  setEditActionTitle: (value: string) => void;
  setEditActionDuration: (value: number) => void;
  setEditActionDelegatedTo: (value: string) => void;
}

export function DraggableActionItem({
  action,
  isSelected,
  isMust,
  isEditing,
  isDelegated,
  editActionTitle,
  editActionDuration,
  editActionDelegatedTo,
  onToggleAction,
  onToggleMust,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  setEditActionTitle,
  setEditActionDuration,
  setEditActionDelegatedTo,
}: DraggableActionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 border-2 border-primary-400 rounded-lg bg-primary-50"
      >
        <div className="flex flex-col gap-2 mb-2">
          <input
            type="text"
            value={editActionTitle}
            onChange={(e) => setEditActionTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit(action.id, action.outcome_id);
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
          />
          <div className="flex gap-2">
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onDelete(action.id, action.outcome_id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
            title="Delete action"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSaveEdit(action.id, action.outcome_id)}
            disabled={!editActionTitle.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-4 border-2 rounded-lg transition-all ${
        isSelected
          ? 'border-green-500 bg-green-50'
          : 'border-white hover:border-gray-300 bg-white'
      } ${isMust ? 'ring-2 ring-orange-300' : ''} ${
        isDelegated ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 p-1 hover:bg-gray-100 rounded"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => onToggleAction(action.id)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isSelected
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300'
          }`}
        >
          {isSelected && <CheckCircle2 className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-gray-900 font-medium">{action.title}</p>
            {isMust && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                <Flame className="w-3 h-3" />
                MUST
              </span>
            )}
            {isDelegated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                <User className="w-3 h-3" />
                {action.delegated_to}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ~{action.duration_minutes || 60} minutes
          </p>
        </div>

        {isSelected && (
          <button
            onClick={() => onToggleMust(action.id)}
            className={`px-3 py-1 text-sm rounded transition-colors flex-shrink-0 ${
              isMust
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isMust ? 'Remove Must' : 'Mark as Must'}
          >
            <Flame className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onStartEdit(action)}
          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors flex-shrink-0"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(action.id, action.outcome_id)}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
          title="Delete action"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
