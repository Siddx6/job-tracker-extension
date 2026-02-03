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

  if (isLoading) {
    return (
      <div className="stats-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
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
      <div className="stat-card">
        <h3>Total Applications</h3>
        <div className="stat-value">{stats.total}</div>
      </div>

      <div className="stat-card">
        <h3>Response Rate</h3>
        <div className="stat-value">{(stats.responseRate * 100).toFixed(1)}%</div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Interviews + Offers / Total Applications
        </p>
      </div>

      {stats.averageTimeToResponse > 0 && (
        <div className="stat-card">
          <h3>Avg. Time to Response</h3>
          <div className="stat-value">{stats.averageTimeToResponse}</div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>days</p>
        </div>
      )}

      <div className="stat-card">
        <h3>Status Breakdown</h3>
        <div className="status-breakdown">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="status-item">
              <span className="status-label">{status}</span>
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;