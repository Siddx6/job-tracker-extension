import React, { useState } from 'react';
import { apiClient } from '../api/client';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await apiClient.login(email, password, { email, password });
      } else {
        await apiClient.register(email, password, {
          email, password,
          name: ''
        });
      }
      onLogin(); 
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Header Section */}
      <div className="auth-header">
        <div className="logo-icon">💼</div>
        <h1>Job Tracker</h1>
        <p className="subtitle">
          {isLogin ? 'Welcome back, Hunter!' : 'Start your journey here.'}
        </p>
      </div>

      {/* The Tab Switcher */}
      <div className="auth-tabs-wrapper">
        <div className="auth-tabs">
          <button 
            className={`tab-btn ${isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`} 
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* The Form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? <div className="spinner-small"></div> : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      
      {/* Footer / Hint */}
      <div className="auth-footer">
        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? ' Sign Up' : ' Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;