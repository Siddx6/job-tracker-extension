import React from 'react';
import { JobApplication, ApplicationStatus } from '../../../shared/types';

interface JobListProps {
  jobs: JobApplication[];
  onStatusChange: (jobId: string, status: ApplicationStatus) => void;
  onDelete: (jobId: string) => void;
  onRefresh: () => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onStatusChange, onDelete, onRefresh }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const colors: Record<ApplicationStatus, string> = {
      saved: '#6c757d',
      applied: '#0066cc',
      interviewing: '#ffc107',
      rejected: '#dc3545',
      offer: '#28a745',
      accepted: '#17a2b8',
    };
    return colors[status];
  };

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px' }}>📭</div>
        <p>No jobs yet. Start saving jobs from job sites!</p>
        <button
          onClick={onRefresh}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="job-list">
      {jobs.map((job) => (
        <div key={job.id} className="job-item">
          <div className="job-header">
            <div className="job-info">
              <h3>{job.title}</h3>
              <p>{job.company}</p>
            </div>
          </div>

          <div className="job-meta">
            {job.location && <span>📍 {job.location}</span>}
            {job.salary && <span>💰 {job.salary}</span>}
            <span>📅 {formatDate(job.dateAdded)}</span>
            <span
              style={{
                background: getStatusColor(job.status as ApplicationStatus),
                color: 'white',
              }}
            >
              {job.status}
            </span>
          </div>

          {job.notes && (
            <p
              style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '8px',
                fontStyle: 'italic',
              }}
            >
              {job.notes}
            </p>
          )}

          <div className="job-actions">
            <select
              value={job.status}
              onChange={(e) => onStatusChange(job.id, e.target.value as ApplicationStatus)}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
            </select>

            <button
              className="btn-link"
              onClick={() => window.open(job.url, '_blank')}
            >
              🔗 Open
            </button>

            <button
              className="btn-delete"
              onClick={() => {
                if (confirm(`Delete "${job.title}"?`)) {
                  onDelete(job.id);
                }
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobList;