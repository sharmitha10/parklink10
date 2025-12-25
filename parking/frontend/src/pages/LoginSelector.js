import React from 'react';
import { Link } from 'react-router-dom';
import { Car, UserCog } from 'lucide-react';
import './Auth.css';

const LoginSelector = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Car size={40} />
          </div>
          <h1>Select Login Type</h1>
          <p>Please choose whether you are a regular user or an admin.</p>
        </div>

        <div className="login-selector-actions">
          <Link to="/user-login" className="btn btn-primary btn-block">
            <UserCog size={20} />
            User Login
          </Link>
          <Link to="/admin-login" className="btn btn-secondary btn-block">
            <UserCog size={20} />
            Admin Login
          </Link>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <Link to="/" className="btn btn-secondary btn-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LoginSelector;
