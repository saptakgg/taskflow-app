import { useState, useEffect, useRef } from 'react';

export default function CommandPanel({ onClose, onAddTask, categories }) {
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('General');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const modalRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById('command-panel-input');
      if (input) input.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Listen for ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Real-time NLP parser as user types in the main title input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // 1. Parse Category (@categoryName)
    const categoryMatch = val.match(/@([a-zA-Z0-9_-]+)/);
    if (categoryMatch) {
      const parsedCat = categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1).toLowerCase();
      // If it exists in categories, set it. Otherwise we'll add it on save.
      setCategory(parsedCat);
    }

    // 2. Parse Priority (!high, !medium, !low or !h, !m, !l)
    const priorityMatch = val.match(/!(high|medium|low|h|m|l)\b/i);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (p === 'high' || p === 'h') setPriority('high');
      else if (p === 'medium' || p === 'm') setPriority('medium');
      else if (p === 'low' || p === 'l') setPriority('low');
    }

    // 3. Parse Due Dates
    const today = new Date();
    const dateMatch = val.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
    if (dateMatch) {
      const keyword = dateMatch[1].toLowerCase();
      const targetDate = new Date();

      if (keyword === 'today') {
        setDueDate(targetDate.toISOString().split('T')[0]);
      } else if (keyword === 'tomorrow') {
        targetDate.setDate(today.getDate() + 1);
        setDueDate(targetDate.toISOString().split('T')[0]);
      } else {
        const daysOfWeek = {
          sun: 0, sunday: 0,
          mon: 1, monday: 1,
          tue: 2, tuesday: 2,
          wed: 3, wednesday: 3,
          thu: 4, thursday: 4,
          fri: 5, friday: 5,
          sat: 6, saturday: 6
        };
        const targetDayNum = daysOfWeek[keyword];
        if (targetDayNum !== undefined) {
          const currentDayNum = today.getDay();
          let daysToAdd = targetDayNum - currentDayNum;
          if (daysToAdd <= 0) daysToAdd += 7;
          targetDate.setDate(today.getDate() + daysToAdd);
          setDueDate(targetDate.toISOString().split('T')[0]);
        }
      }
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Clean text by removing parsed syntax tokens
    let cleanedTitle = inputValue
      .replace(/@[a-zA-Z0-9_-]+/g, '')
      .replace(/!(high|medium|low|h|m|l)\b/gi, '')
      .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedTitle) {
      cleanedTitle = inputValue.trim(); // Fallback if user only typed tokens
    }

    let finalCategory = category;
    if (showCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
    }

    onAddTask({
      title: cleanedTitle,
      category: finalCategory,
      priority,
      dueDate: dueDate || null,
      subtasks
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="modal-card" 
        style={{ maxWidth: '600px', gap: 'var(--space-md)' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-mute)' }}>▲</span>
            <h2 className="title-sm" style={{ margin: 0 }}>Create new task.</h2>
          </div>
          <button className="action-btn" onClick={onClose} title="Cancel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <input
            id="command-panel-input"
            type="text"
            className="form-input-lg"
            placeholder="Type task details... (e.g. Write PR review @work !high tomorrow)"
            value={inputValue}
            onChange={handleInputChange}
            style={{ width: '100%', outline: 'none', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-md)' }}
          />
        </div>

        {/* Picker Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          
          {/* Priority (Visual selection) */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              {['low', 'medium', 'high'].map((p) => {
                const colors = {
                  high: 'var(--color-priority-high)',
                  medium: 'var(--color-priority-medium)',
                  low: 'var(--color-priority-low)'
                };
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      textTransform: 'capitalize',
                      borderColor: active ? colors[p] : 'var(--color-hairline)',
                      backgroundColor: active ? 'var(--color-canvas-soft-2)' : 'var(--color-canvas)',
                      fontWeight: active ? '600' : '400',
                      color: active ? 'var(--color-ink)' : 'var(--color-mute)'
                    }}
                  >
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: colors[p],
                      marginRight: '6px',
                      display: 'inline-block'
                    }}></span>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date (Visual selection) */}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ height: '32px' }}
            />
          </div>

        </div>

        {/* Category Visual selector */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Category</label>
            <button 
              type="button" 
              onClick={() => setShowCustomCategory(!showCustomCategory)}
              style={{ background: 'none', border: 'none', color: 'var(--color-link)', cursor: 'pointer', fontSize: '11px' }}
            >
              {showCustomCategory ? "Select existing" : "+ Create custom"}
            </button>
          </div>
          {showCustomCategory ? (
            <input
              type="text"
              className="form-input"
              placeholder="New category name..."
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              style={{ height: '32px' }}
              autoFocus
            />
          ) : (
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ height: '32px' }}
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Subtask checklist builder */}
        <div className="form-group" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-sm)' }}>
          <label className="form-label">Add subtasks / checklist items</label>
          
          {subtasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)', maxHeight: '90px', overflowY: 'auto', marginBottom: 'var(--space-xs)' }}>
              {subtasks.map((st) => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-body)' }}>• {st.title}</span>
                  <button 
                    type="button" 
                    className="action-btn delete" 
                    onClick={() => handleRemoveSubtask(st.id)}
                    style={{ width: '20px', height: '20px' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add checklist subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              style={{ height: '32px', fontSize: '12px' }}
            />
            <button type="submit" className="btn-secondary-sm" style={{ height: '32px' }}>
              Add
            </button>
          </form>
        </div>

        {/* Footer controls */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-xxs)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginRight: 'auto', alignItems: 'center', color: 'var(--color-mute)' }}>
            <span style={{ fontSize: '11px' }}><kbd>ESC</kbd> Cancel</span>
            <span style={{ fontSize: '11px' }}><kbd>↵ Enter</kbd> Create</span>
          </div>
          <button className="btn-secondary" style={{ height: '36px', fontSize: '13px' }} onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            style={{ height: '36px', fontSize: '13px' }} 
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
          >
            Create Task
          </button>
        </div>

      </div>
    </div>
  );
}
