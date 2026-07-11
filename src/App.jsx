import { useState, useEffect } from 'react';
import CommandPanel from './components/CommandPanel';
import CalendarStrip from './components/CalendarStrip';
import TaskCard from './components/TaskCard';
import InspectorModal from './components/InspectorModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Toast from './components/Toast';

const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Side Projects', 'General'];

const getTodayDateStr = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

const getDayOfWeekDateStr = (dayName) => {
  const daysOfWeek = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = daysOfWeek[dayName.toLowerCase()] - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split('T')[0];
};

const DEFAULT_TODOS = [
  {
    id: 'todo-1',
    title: 'Verify release candidate 1.4.0',
    category: 'Work',
    priority: 'high',
    dueDate: getTodayDateStr(0),
    completed: false,
    notes: 'Check bundle sizes and lighthouse scoring. Make sure there are no regression issues in the UI animations.',
    completedAt: null,
    subtasks: [
      { id: 'sub-1', title: 'Check production JS bundle size', completed: true },
      { id: 'sub-2', title: 'Verify service worker HMR in local build', completed: false },
      { id: 'sub-3', title: 'Audit canvas rendering speed', completed: false }
    ]
  },
  {
    id: 'todo-2',
    title: 'Design system review with styling team',
    category: 'Work',
    priority: 'medium',
    dueDate: getTodayDateStr(1),
    completed: false,
    notes: 'Confirm that weight 600 is the absolute display ceiling as per the design specifications in DESIGN.md.',
    completedAt: null,
    subtasks: [
      { id: 'sub-4', title: 'Check typography hierarchy settings', completed: false },
      { id: 'sub-5', title: 'Verify hairline borders color contrast in dark mode', completed: false }
    ]
  },
  {
    id: 'todo-3',
    title: 'Setup personal budget dashboard spreadsheet',
    category: 'Personal',
    priority: 'low',
    dueDate: getTodayDateStr(0),
    completed: true,
    notes: 'Imported csv transactions from banking statements.',
    completedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    subtasks: []
  },
  {
    id: 'todo-4',
    title: 'Draft side-project architecture docs',
    category: 'Side Projects',
    priority: 'high',
    dueDate: null,
    completed: false,
    notes: 'Need to document the schema relations and check graph endpoints.',
    completedAt: null,
    subtasks: [
      { id: 'sub-6', title: 'Define schema relations', completed: false },
      { id: 'sub-7', title: 'Choose database hosting provider', completed: false }
    ]
  },
  {
    id: 'todo-5',
    title: 'Weekly grocery run & meal planning',
    category: 'Personal',
    priority: 'low',
    dueDate: getDayOfWeekDateStr('sun'),
    completed: false,
    notes: 'Buy spinach, avocados, chicken breasts, eggs, and Greek yogurt.',
    completedAt: null,
    subtasks: []
  }
];

export default function App() {
  // State
  const [todos, setTodos] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('taskflow_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch('/api/todos');
        if (res.ok) {
          const data = await res.json();
          setTodos(data);
          setIsBackendConnected(true);
          addToast('Database synchronized.', 'success');
        } else {
          throw new Error('API failed');
        }
      } catch {
        console.warn("Backend API not reachable. Using localStorage.");
        const saved = localStorage.getItem('taskflow_todos');
        setTodos(saved ? JSON.parse(saved) : DEFAULT_TODOS);
        setIsBackendConnected(false);
      }
    };
    fetchTodos();
  }, []);

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState('active'); // active, completed, all
  const [inspectorTaskId, setInspectorTaskId] = useState(null);
  const [isCommandPanelOpen, setIsCommandPanelOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('taskflow_dark_mode');
    return saved ? JSON.parse(saved) === true : false;
  });

  // Local storage synchronization (backup if local, or cache if connected)
  useEffect(() => {
    if (todos && todos.length > 0) {
      localStorage.setItem('taskflow_todos', JSON.stringify(todos));
    }
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('taskflow_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('taskflow_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Focus search input on "/" and open command panel on "c"/"n"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search tasks..."]');
        if (searchInput) searchInput.focus();
      }
      if ((e.key === 'c' || e.key === 'n') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsCommandPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'work':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case 'personal':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'side projects':
      case 'sideprojects':
      case 'side_projects':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        );
    }
  };

  // Toast helper
  const addToast = (message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, duration: 4000 }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Todo operations
  const handleAddTask = async (taskFields) => {
    const newTodo = {
      id: crypto.randomUUID(),
      title: taskFields.title,
      category: taskFields.category || 'General',
      priority: taskFields.priority || 'medium',
      dueDate: taskFields.dueDate || null,
      completed: false,
      notes: '',
      completedAt: null,
      subtasks: taskFields.subtasks || []
    };

    // Update local state (optimistic)
    setTodos((prev) => [newTodo, ...prev]);
    addToast(`Task "${newTodo.title.slice(0, 20)}${newTodo.title.length > 20 ? '...' : ''}" created.`, 'success');

    if (isBackendConnected) {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTodo)
        });
        if (!res.ok) throw new Error('API failed');
      } catch (err) {
        console.error("Failed to save task to backend:", err);
        addToast("Backend sync failed. Saved locally.", "error");
      }
    }
  };

  const handleToggleTask = async (id) => {
    let updatedTodo = null;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          const completed = !todo.completed;
          updatedTodo = {
            ...todo,
            completed,
            completedAt: completed ? new Date().toISOString() : null,
            subtasks: todo.subtasks.map((st) => ({ ...st, completed }))
          };
          return updatedTodo;
        }
        return todo;
      })
    );

    const todo = todos.find((t) => t.id === id);
    if (todo) {
      addToast(todo.completed ? `Task marked active.` : `Task completed! ⚡`, todo.completed ? 'info' : 'success');
    }

    if (isBackendConnected && updatedTodo) {
      try {
        await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTodo)
        });
      } catch (err) {
        console.error("Failed to update task in backend:", err);
      }
    }
  };

  const handleToggleSubtask = async (todoId, subtaskId) => {
    let updatedTodo = null;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const updatedSubtasks = todo.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
          updatedTodo = {
            ...todo,
            subtasks: updatedSubtasks,
            completed: allCompleted,
            completedAt: allCompleted ? new Date().toISOString() : todo.completedAt
          };
          return updatedTodo;
        }
        return todo;
      })
    );

    if (isBackendConnected && updatedTodo) {
      try {
        await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTodo)
        });
      } catch (err) {
        console.error("Failed to update subtask in backend:", err);
      }
    }
  };

  const handleDeleteTask = async (id) => {
    const todo = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    const titleSnippet = todo ? `"${todo.title.slice(0, 15)}${todo.title.length > 15 ? '...' : ''}"` : 'Task';
    addToast(`${titleSnippet} deleted.`, 'info');

    if (isBackendConnected) {
      try {
        await fetch(`/api/todos?id=${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Failed to delete task from backend:", err);
      }
    }
  };

  const handleSaveTaskDetails = async (id, updatedFields) => {
    let updatedTodo = null;
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          if (updatedFields.category && !categories.includes(updatedFields.category)) {
            setCategories((prevCats) => [...prevCats, updatedFields.category]);
          }
          updatedTodo = { ...todo, ...updatedFields };
          return updatedTodo;
        }
        return todo;
      })
    );

    setInspectorTaskId(null);
    addToast('Task details updated.', 'success');

    if (isBackendConnected && updatedTodo) {
      try {
        await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTodo)
        });
      } catch (err) {
        console.error("Failed to update task details in backend:", err);
      }
    }
  };

  // State Management actions
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ todos, categories }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `taskflow_backup_${getTodayDateStr()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Data exported successfully.', 'success');
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.todos && Array.isArray(parsed.todos)) {
          setTodos(parsed.todos);
          if (parsed.categories && Array.isArray(parsed.categories)) {
            setCategories(parsed.categories);
          }
          addToast('Backup imported successfully.', 'success');
        } else {
          addToast('Invalid backup file format.', 'error');
        }
      } catch {
        addToast('Error parsing file.', 'error');
      }
    };
    fileReader.readAsText(file);
    e.target.value = ''; // Reset uploader input
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to restore defaults? All current tasks will be lost.")) {
      setTodos(DEFAULT_TODOS);
      setCategories(DEFAULT_CATEGORIES);
      addToast('Data reset to default demo.', 'info');
    }
  };

  // Filter Tasks
  const getFilteredTodos = () => {
    return todos.filter((todo) => {
      // Search matches
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (todo.notes && todo.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category matches
      const matchesCategory = selectedCategoryFilter ? todo.category === selectedCategoryFilter : true;
      
      // Priority matches
      const matchesPriority = selectedPriorityFilter ? todo.priority === selectedPriorityFilter : true;
      
      // Date matches
      const matchesDate = selectedDateFilter ? todo.dueDate === selectedDateFilter : true;
      
      // Status matches
      let matchesStatus = true;
      if (showCompleted === 'active') matchesStatus = !todo.completed;
      if (showCompleted === 'completed') matchesStatus = todo.completed;

      return matchesSearch && matchesCategory && matchesPriority && matchesDate && matchesStatus;
    });
  };

  const filteredTodos = getFilteredTodos();
  const activeInspectorTask = todos.find((t) => t.id === inspectorTaskId);

  // Stats for sidebar tags
  const getCategoryCount = (cat) => {
    return todos.filter((t) => t.category === cat && !t.completed).length;
  };

  const getPriorityCount = (prio) => {
    return todos.filter((t) => t.priority === prio && !t.completed).length;
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-logo" onClick={() => setCurrentView('dashboard')}>
          <span style={{ fontSize: '20px' }}>▲</span>
          <span>TASK.FLOW.</span>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '10px', 
            fontFamily: 'var(--font-mono)', 
            marginLeft: '8px', 
            padding: '2px 6px', 
            borderRadius: 'var(--radius-xs)', 
            backgroundColor: 'var(--color-canvas-soft-2)',
            color: isBackendConnected ? 'var(--color-success)' : 'var(--color-mute)'
          }}>
            <span style={{ 
              width: '5px', 
              height: '5px', 
              borderRadius: '50%', 
              backgroundColor: isBackendConnected ? 'var(--color-success)' : 'var(--color-mute)' 
            }}></span>
            {isBackendConnected ? 'CLOUD' : 'LOCAL'}
          </span>
        </div>
        <div className="nav-links">
          <div 
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setCurrentView('dashboard'); setSelectedDateFilter(null); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            Dashboard
          </div>
          <div 
            className={`nav-link ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Timeline
          </div>
          <div 
            className={`nav-link ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </div>
        </div>
        <div className="nav-actions">
          <button 
            className="btn-primary-sm" 
            onClick={() => setIsCommandPanelOpen(true)}
            style={{ height: '30px', borderRadius: 'var(--radius-pill)', gap: '6px', padding: '0 var(--space-sm)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Task
            <kbd style={{ marginLeft: '4px', background: 'rgba(255,255,255,0.15)', color: 'var(--color-on-primary)', borderColor: 'transparent', fontSize: '9px' }}>C</kbd>
          </button>
          <button 
            className="action-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Hero band with mesh gradient */}
      {currentView === 'dashboard' && (
        <header className="hero-band">
          <div className="mesh-gradient-bg"></div>
          <h1 className="title-xl" style={{ marginBottom: '12px' }}>Engineering your productivity.</h1>
          <p style={{ color: 'var(--color-body)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            A stark, keyboard-friendly workspace optimized for developer workflow, tracking subtasks, visual deadlines, and analytics.
          </p>
        </header>
      )}

      {/* Main Container App Shell */}
      <main className="app-shell">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          {/* Views Section */}
          <div className="sidebar-section">
            <span className="mono-label sidebar-heading">Workspace</span>
            <ul className="sidebar-list">
              <li 
                className={`sidebar-item ${showCompleted === 'active' ? 'active' : ''}`}
                onClick={() => setShowCompleted('active')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Active Tasks</span>
                </div>
                <span className="sidebar-item-pill">
                  {todos.filter(t => !t.completed).length}
                </span>
              </li>
              <li 
                className={`sidebar-item ${showCompleted === 'completed' ? 'active' : ''}`}
                onClick={() => setShowCompleted('completed')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Resolved Tasks</span>
                </div>
                <span className="sidebar-item-pill">
                  {todos.filter(t => t.completed).length}
                </span>
              </li>
              <li 
                className={`sidebar-item ${showCompleted === 'all' ? 'active' : ''}`}
                onClick={() => setShowCompleted('all')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="17" x2="15" y2="17"></line>
                  </svg>
                  <span>All Tasks</span>
                </div>
                <span className="sidebar-item-pill">{todos.length}</span>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="sidebar-section">
            <span className="mono-label sidebar-heading">Categories</span>
            <ul className="sidebar-list">
              <li 
                className={`sidebar-item ${selectedCategoryFilter === null ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>All Categories</span>
                </div>
              </li>
              {categories.map((cat, idx) => (
                <li 
                  key={idx}
                  className={`sidebar-item ${selectedCategoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryFilter(cat)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                    {getCategoryIcon(cat)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                  </div>
                  {getCategoryCount(cat) > 0 && (
                    <span className="sidebar-item-pill">{getCategoryCount(cat)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Priorities */}
          <div className="sidebar-section">
            <span className="mono-label sidebar-heading">Priorities</span>
            <ul className="sidebar-list">
              <li 
                className={`sidebar-item ${selectedPriorityFilter === null ? 'active' : ''}`}
                onClick={() => setSelectedPriorityFilter(null)}
              >
                <span>All Priorities</span>
              </li>
              <li 
                className={`sidebar-item ${selectedPriorityFilter === 'high' ? 'active' : ''}`}
                onClick={() => setSelectedPriorityFilter('high')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-priority-high)' }}></span>
                  High
                </div>
                {getPriorityCount('high') > 0 && (
                  <span className="sidebar-item-pill">{getPriorityCount('high')}</span>
                )}
              </li>
              <li 
                className={`sidebar-item ${selectedPriorityFilter === 'medium' ? 'active' : ''}`}
                onClick={() => setSelectedPriorityFilter('medium')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-priority-medium)' }}></span>
                  Medium
                </div>
                {getPriorityCount('medium') > 0 && (
                  <span className="sidebar-item-pill">{getPriorityCount('medium')}</span>
                )}
              </li>
              <li 
                className={`sidebar-item ${selectedPriorityFilter === 'low' ? 'active' : ''}`}
                onClick={() => setSelectedPriorityFilter('low')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-priority-low)' }}></span>
                  Low
                </div>
                {getPriorityCount('low') > 0 && (
                  <span className="sidebar-item-pill">{getPriorityCount('low')}</span>
                )}
              </li>
            </ul>
          </div>

          {/* Backup / Restore controls */}
          <div className="sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
            <span className="mono-label sidebar-heading">Data Controller</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button className="btn-secondary-sm" onClick={handleExportData} style={{ justifyContent: 'center' }}>
                Export Backup (JSON)
              </button>
              <label className="btn-secondary-sm" style={{ justifyContent: 'center', cursor: 'pointer', textAlign: 'center' }}>
                Import Backup
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData} 
                  style={{ display: 'none' }}
                />
              </label>
              <button 
                className="btn-secondary-sm" 
                onClick={handleResetData}
                style={{ color: 'var(--color-priority-high)', justifyContent: 'center' }}
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </aside>

        {/* Workspace views */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {currentView === 'dashboard' && (
            <>
              {/* Weekly Calendar Strip */}
              <CalendarStrip
                selectedDate={selectedDateFilter}
                onSelectDate={setSelectedDateFilter}
                tasks={todos}
              />

              {/* Workspace filters bar */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-xs)' }}>
                {/* Search query */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '32px' }}
                  />
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-mute)"
                    strokeWidth="2.5"
                    style={{ position: 'absolute', left: '10px', top: '13px' }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                
                {/* Filter tags summary and clear filters option */}
                {(selectedCategoryFilter || selectedPriorityFilter || selectedDateFilter || searchQuery) && (
                  <button
                    className="btn-secondary-sm"
                    onClick={() => {
                      setSelectedCategoryFilter(null);
                      setSelectedPriorityFilter(null);
                      setSelectedDateFilter(null);
                      setSearchQuery('');
                    }}
                    style={{ height: '32px' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="task-list">
                {filteredTodos.length === 0 ? (
                  <div className="chart-card" style={{ padding: 'var(--space-3xl)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas-soft-2)', border: '1px dashed var(--color-hairline-strong)', boxShadow: 'none' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-mute)" strokeWidth="1" style={{ marginBottom: 'var(--space-md)', opacity: 0.6 }} aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-ink)', marginBottom: '4px' }}>All tasks resolved.</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-mute)', textAlign: 'center', maxWidth: '280px' }}>
                      Everything is clear in this workspace filters. Add a new task or change your filters.
                    </span>
                  </div>
                ) : (
                  filteredTodos.map((todo) => (
                    <TaskCard
                      key={todo.id}
                      task={todo}
                      onToggleTask={handleToggleTask}
                      onDeleteTask={handleDeleteTask}
                      onOpenInspector={setInspectorTaskId}
                      onToggleSubtask={handleToggleSubtask}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {currentView === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div>
                <h2 className="title-md" style={{ marginBottom: '4px' }}>Timeline schedule.</h2>
                <p style={{ color: 'var(--color-body)', fontSize: '13px' }}>
                  A visual overview of tasks grouped chronologically.
                </p>
              </div>

              {/* Timeline Grouping */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                {(() => {
                  // Group tasks by date
                  const groups = {};
                  todos.forEach(todo => {
                    const key = todo.dueDate || 'No Due Date';
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(todo);
                  });

                  // Sort dates (No Due Date last)
                  const sortedKeys = Object.keys(groups).sort((a, b) => {
                    if (a === 'No Due Date') return 1;
                    if (b === 'No Due Date') return -1;
                    return new Date(a) - new Date(b);
                  });

                  if (todos.length === 0) {
                    return (
                      <div className="chart-card" style={{ padding: 'var(--space-3xl)', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--color-mute)' }}>No tasks scheduled.</span>
                      </div>
                    );
                  }

                  return sortedKeys.map((dateStr, idx) => {
                    const groupTodos = groups[dateStr];
                    const label = dateStr === 'No Due Date' ? 'No Due Date' : new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                    
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <span className="mono-label" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: '4px', fontSize: '10px' }}>
                          {label}
                        </span>
                        <div className="task-list">
                          {groupTodos.map(todo => (
                            <TaskCard
                              key={todo.id}
                              task={todo}
                              onToggleTask={handleToggleTask}
                              onDeleteTask={handleDeleteTask}
                              onOpenInspector={setInspectorTaskId}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {currentView === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div>
                <h2 className="title-md" style={{ marginBottom: '4px' }}>Workspace diagnostics.</h2>
                <p style={{ color: 'var(--color-body)', fontSize: '13px' }}>
                  Analytics report detailing completion metrics, category spreads, and active streaks.
                </p>
              </div>
              <AnalyticsDashboard tasks={todos} categories={categories} />
            </div>
          )}
        </section>
      </main>

      {/* Details Inspector Modal (Level 5) */}
      {activeInspectorTask && (
        <InspectorModal
          task={activeInspectorTask}
          categories={categories}
          onClose={() => setInspectorTaskId(null)}
          onSave={handleSaveTaskDetails}
        />
      )}

      {/* Command Panel Modal (Level 5) */}
      {isCommandPanelOpen && (
        <CommandPanel
          categories={categories}
          onClose={() => setIsCommandPanelOpen(false)}
          onAddTask={handleAddTask}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </>
  );
}
