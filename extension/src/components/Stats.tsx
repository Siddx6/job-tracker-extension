import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { JobStats } from '../../../shared/types';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiClient.getJobStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Capitalize first letter (e.g. "applied" -> "Applied")
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-container">
        <div className="empty-state">
          <p>Unable to load statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {/* Top Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <h3>Total Applications</h3>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card">
          <h3>Response Rate</h3>
          <div className="stat-value text-gradient">
            {(stats.responseRate * 100).toFixed(1)}%
          </div>
          <p className="stat-subtitle">Interviews / Applications</p>
        </div>
      </div>

      {/* Avg Time Card (Optional) */}
      {stats.averageTimeToResponse > 0 && (
        <div className="stat-card" style={{ marginTop: '12px' }}>
          <h3>Avg. Time to Response</h3>
          <div className="stat-value" style={{ fontSize: '24px' }}>
            {stats.averageTimeToResponse} <span style={{ fontSize: '14px', color: '#94a3b8' }}>days</span>
          </div>
        </div>
      )}

      {/* Status Breakdown List */}
      <div className="stat-card full-width" style={{ marginTop: '12px' }}>
        <h3>Status Breakdown</h3>
        <div className="status-breakdown">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="status-row">
              <div className="status-info">
                {/* Colored Dot */}
                <span className={`status-dot ${status.toLowerCase()}`}></span>
                {/* Capitalized Text */}
                <span className="status-label">{formatStatus(status)}</span>
              </div>
              {/* Count Pill */}
              <span className="status-pill">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;