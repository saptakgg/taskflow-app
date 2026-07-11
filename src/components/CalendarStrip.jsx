import { useState } from 'react';

export default function CalendarStrip({ selectedDate, onSelectDate, tasks }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getDaysOfWeek = (startDate) => {
    const days = [];
    const tempDate = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  };

  const days = getDaysOfWeek(currentWeekStart);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
    onSelectDate(new Date().toISOString().split('T')[0]);
  };

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="mono-label" style={{ fontSize: '12px' }}>
          Schedule
          {selectedDate && (
            <span style={{ textTransform: 'none', marginLeft: '8px', color: 'var(--color-ink)' }}>
              ({new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
          <button onClick={handlePrevWeek} className="btn-secondary-sm" style={{ padding: '0 8px', height: '24px' }} title="Previous Week">
            ←
          </button>
          <button onClick={handleToday} className="btn-secondary-sm" style={{ fontSize: '10px', height: '24px' }}>
            Today
          </button>
          <button onClick={handleNextWeek} className="btn-secondary-sm" style={{ padding: '0 8px', height: '24px' }} title="Next Week">
            →
          </button>
        </div>
      </div>

      <div className="calendar-strip">
        {days.map((day, idx) => {
          const dateStr = formatDateString(day);
          const active = selectedDate === dateStr;
          const dayTasks = tasks.filter(task => task.dueDate === dateStr);
          const pendingCount = dayTasks.filter(t => !t.completed).length;

          return (
            <div
              key={idx}
              className={`calendar-day-card ${active ? 'active' : ''}`}
              onClick={() => onSelectDate(active ? null : dateStr)}
              style={isToday(day) && !active ? { borderColor: 'var(--color-link)' } : {}}
            >
              <span className="calendar-day-name">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="calendar-day-num">{day.getDate()}</span>
              
              <div className="calendar-dot-container">
                {Array.from({ length: Math.min(pendingCount, 3) }).map((_, dIdx) => (
                  <span key={dIdx} className="calendar-dot" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
