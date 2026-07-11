import React from 'react';

export default function AnalyticsDashboard({ tasks, categories }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak calculation (consecutive days with completed tasks)
  const getStreak = () => {
    if (completedTasks === 0) return 0;
    const completedDates = [...new Set(
      tasks
        .filter((t) => t.completed && t.completedAt)
        .map((t) => t.completedAt.split('T')[0])
    )].sort((a, b) => new Date(b) - new Date(a)); // Descending order

    if (completedDates.length === 0) return 0;

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0,0,0,0);
    
    // Check if the most recent completion is today or yesterday
    const latestDate = new Date(completedDates[0]);
    latestDate.setHours(0,0,0,0);
    const diffTime = Math.abs(expectedDate - latestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0; // Streak broken

    for (let i = 0; i < completedDates.length; i++) {
      const date = new Date(completedDates[i]);
      date.setHours(0,0,0,0);
      
      const checkDiff = Math.abs(expectedDate - date);
      const checkDays = Math.ceil(checkDiff / (1000 * 60 * 60 * 24));
      
      if (checkDays === streak) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak();

  // Progress Ring configurations
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Categories Breakdown
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const catTotal = catTasks.length;
    const catCompleted = catTasks.filter((t) => t.completed).length;
    const catRate = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    return { name: cat, total: catTotal, completed: catCompleted, rate: catRate };
  }).filter((c) => c.total > 0);

  // Priorities Breakdown
  const priorities = ['high', 'medium', 'low'];
  const priorityStats = priorities.map((prio) => {
    const prioTasks = tasks.filter((t) => t.priority === prio);
    const prioTotal = prioTasks.length;
    const prioCompleted = prioTasks.filter((t) => t.completed).length;
    return { name: prio, total: prioTotal, completed: prioCompleted };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* STATS TILES */}
      <div className="analytics-grid">
        <div className="stat-card">
          <span className="mono-label" style={{ fontSize: '10px' }}>Total Tasks</span>
          <span className="stat-num">{totalTasks}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-link)' }}>
          <span className="mono-label" style={{ fontSize: '10px' }}>Completed</span>
          <span className="stat-num">{completedTasks}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-mute)' }}>
          <span className="mono-label" style={{ fontSize: '10px' }}>Pending</span>
          <span className="stat-num">{pendingTasks}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--color-priority-medium)' }}>
          <span className="mono-label" style={{ fontSize: '10px' }}>Current Streak</span>
          <span className="stat-num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {streak}
            <span style={{ fontSize: '16px', color: 'var(--color-priority-medium)' }}>⚡</span>
          </span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="analytics-charts">
        {/* PROGRESS GAUGE */}
        <div className="chart-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono-label" style={{ marginBottom: 'var(--space-sm)' }}>Completion Rate</span>
          <div className="progress-ring-container" style={{ width: '180px', height: '180px' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="gradient-mesh" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--gradient-develop-start)" />
                  <stop offset="50%" stopColor="var(--gradient-preview-start)" />
                  <stop offset="100%" stopColor="var(--gradient-preview-end)" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="var(--color-canvas-soft-2)"
                strokeWidth={strokeWidth}
              />
              {/* Indicator circle */}
              <circle
                className="progress-ring-circle"
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke="url(#gradient-mesh)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-ring-text">
              {completionRate}%
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-mute)', marginTop: '8px', textAlign: 'center' }}>
            {completedTasks} of {totalTasks} items resolved.
          </span>
        </div>

        {/* CATEGORY PROGRESS LIST */}
        <div className="chart-card">
          <span className="mono-label">Distribution by Category</span>
          {categoryStats.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-mute)', fontSize: '13px' }}>
              No categories recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', justifyContent: 'center', height: '100%' }}>
              {categoryStats.map((cat, idx) => (
                <div key={idx} className="chart-bar-row">
                  <div className="chart-bar-item">
                    <span className="chart-bar-label">{cat.name}</span>
                    <div className="chart-bar-bg">
                      <div className="chart-bar-fill" style={{ width: `${cat.rate}%` }}></div>
                    </div>
                    <span className="chart-bar-val">{cat.completed}/{cat.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRIORITY STATS CARD */}
      <div className="chart-card" style={{ gridColumn: 'span 2' }}>
        <span className="mono-label">Distribution by Priority</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
          {priorityStats.map((prio, idx) => {
            const colors = {
              high: 'var(--color-priority-high)',
              medium: 'var(--color-priority-medium)',
              low: 'var(--color-priority-low)'
            };
            const rate = prio.total > 0 ? Math.round((prio.completed / prio.total) * 100) : 0;
            return (
              <div key={idx} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', background: 'var(--color-canvas-soft-2)', border: '1px solid var(--color-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="mono-label" style={{ color: colors[prio.name], fontWeight: '600' }}>
                    {prio.name}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-mute)' }}>
                    {prio.completed}/{prio.total}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'var(--color-hairline)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: colors[prio.name], width: `${rate}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
