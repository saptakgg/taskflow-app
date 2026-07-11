import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-priority-high)" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-link)" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <div className="toast">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {getIcon()}
        <span>{toast.message}</span>
      </div>
      <button className="toast-close" onClick={() => onClose(toast.id)}>
        &times;
      </button>
    </div>
  );
}
