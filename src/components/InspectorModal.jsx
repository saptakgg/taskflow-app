import { useState } from 'react';

export default function InspectorModal({ task, onClose, onSave, categories }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [category, setCategory] = useState(task.category || 'General');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  
  // Subtasks editing state
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSubtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const handleSave = () => {
    let finalCategory = category;
    if (showAddCategory && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
    }
    
    onSave(task.id, {
      title: title.trim() || task.title,
      notes: notes.trim(),
      priority,
      category: finalCategory,
      dueDate: dueDate || null,
      subtasks
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="title-sm" style={{ margin: 0 }}>Edit task details.</h2>
          <button className="action-btn" onClick={onClose} title="Close details">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              style={{ height: '80px', padding: 'var(--space-xs)', resize: 'none' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details or context..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Category</label>
              <button 
                type="button" 
                onClick={() => setShowAddCategory(!showAddCategory)}
                style={{ background: 'none', border: 'none', color: 'var(--color-link)', cursor: 'pointer', fontSize: '11px' }}
              >
                {showAddCategory ? "Select existing" : "+ Create custom"}
              </button>
            </div>
            {showAddCategory ? (
              <input
                type="text"
                className="form-input"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
            ) : (
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="form-group">
            <label className="form-label">Checklist / Subtasks</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', maxHeight: '140px', overflowY: 'auto', marginBottom: 'var(--space-xs)' }}>
              {subtasks.map((st) => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st.id)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--color-mute)' : 'var(--color-ink)' }}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() => handleRemoveSubtask(st.id)}
                    style={{ width: '22px', height: '22px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                style={{ height: '32px', fontSize: '13px' }}
              />
              <button type="submit" className="btn-secondary-sm" style={{ height: '32px' }}>
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" style={{ height: '36px', fontSize: '13px' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" style={{ height: '36px', fontSize: '13px' }} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
