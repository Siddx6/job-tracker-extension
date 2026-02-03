import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { JobApplication, ApplicationStatus } from '../../../shared/types';
import Auth from '../components/Auth';
import JobList from '../components/JobList';
import Stats from '../components/Stats';
import './popup.css';

type View = 'jobs' | 'stats';

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('jobs');
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadJobs();
    }
  }, [isAuthenticated, filterStatus]);

  const checkAuthentication = async () => {
    try {
      const token = await apiClient.getToken();
      if (token) {
        await apiClient.getMe();
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await apiClient.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const jobsData = await apiClient.getJobs(params);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setJobs([]);
  };

  const handleStatusChange = async (jobId: string, status: ApplicationStatus) => {
    try {
      await apiClient.updateJob(jobId, { status });
      await loadJobs();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await apiClient.deleteJob(jobId);
      await loadJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="popup-container">
      <header className="header">
        <h1>💼 Job Tracker</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="nav-tabs">
        <button
          className={currentView === 'jobs' ? 'active' : ''}
          onClick={() => setCurrentView('jobs')}
        >
          Jobs
        </button>
        <button
          className={currentView === 'stats' ? 'active' : ''}
          onClick={() => setCurrentView('stats')}
        >
          Stats
        </button>
      </nav>

      {currentView === 'jobs' && (
        <>
          <div className="filter-section">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Jobs</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>

          <JobList
            jobs={jobs}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteJob}
            onRefresh={loadJobs}
          />
        </>
      )}

      {currentView === 'stats' && <Stats />}
    </div>
  );
};

export default Popup;