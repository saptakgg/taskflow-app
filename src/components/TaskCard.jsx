import { useState } from 'react';

export default function TaskCard({ task, onToggleTask, onDeleteTask, onOpenInspector, onToggleSubtask }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const subtasksCount = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasksCount = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;

  const handleCardClick = (e) => {
    // Prevent double trigger on interactive controls
    if (e.target.closest('.task-checkbox-wrapper') || e.target.closest('.action-btn')) {
      return;
    }
    onOpenInspector(task.id);
  };

  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'work':
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', flexShrink: 0 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case 'personal':
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'side projects':
      case 'sideprojects':
      case 'side_projects':
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', flexShrink: 0 }}>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      default:
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', flexShrink: 0 }}>
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`task-card ${task.completed ? 'completed' : ''}`}
      onClick={handleCardClick}
      style={{ position: 'relative' }}
    >
      <div className="task-card-main">
        <div className="task-card-left">
          {/* Custom Checkbox */}
          <label className="task-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="task-checkbox-input"
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />
            <span className="task-checkbox-custom">
              <svg className="task-checkbox-icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </label>

          <div className="task-details">
            <span className="task-title">{task.title}</span>
            <div className="task-meta-row">
              {/* Priority */}
              {task.priority && (
                <span className={`meta-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
              )}
              {/* Category */}
              {task.category && task.category !== 'General' && (
                <span className="meta-badge category-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {getCategoryIcon(task.category)}
                  {task.category}
                </span>
              )}
              {/* Due Date */}
              {task.dueDate && (
                <span
                  className="meta-badge"
                  style={
                    isOverdue()
                      ? { color: 'var(--color-priority-high)', borderColor: 'var(--color-priority-high-soft)', backgroundColor: 'var(--color-priority-high-soft)' }
                      : {}
                  }
                >
                  {isOverdue() ? 'Overdue: ' : ''}
                  {getFormattedDate(task.dueDate)}
                </span>
              )}
              {/* Subtask indicator */}
              {subtasksCount > 0 && (
                <span
                  className="meta-badge"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="9" y1="6" x2="20" y2="6"></line>
                    <line x1="9" y1="12" x2="20" y2="12"></line>
                    <line x1="9" y1="18" x2="20" y2="18"></line>
                    <line x1="5" y1="6" x2="5.01" y2="6"></line>
                    <line x1="5" y1="12" x2="5.01" y2="12"></line>
                    <line x1="5" y1="18" x2="5.01" y2="18"></line>
                  </svg>
                  {completedSubtasksCount}/{subtasksCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="task-actions">
          {subtasksCount > 0 && (
            <button
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? "Collapse checklist" : "Expand checklist"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          )}
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(task.id);
            }}
            title="Edit task properties"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button
            className="action-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            title="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable subtasks checklist */}
      {isExpanded && subtasksCount > 0 && (
        <div className="subtasks-section" onClick={(e) => e.stopPropagation()}>
          {task.subtasks.map((st) => (
            <div key={st.id} className={`subtask-item ${st.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                className="subtask-checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask(task.id, st.id)}
              />
              <span className="subtask-title">{st.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
