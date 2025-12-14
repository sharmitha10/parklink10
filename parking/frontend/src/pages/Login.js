import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Mail, Lock, AlertCircle } from 'lucide-react';
import './Auth.css';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Translation keys for the login page
  const tKeys = {
    welcomeBack: t('login.welcomeBack', 'Welcome Back'),
    signInText: t('login.signInText', 'Sign in to your ParkLink account'),
    emailAddress: t('login.emailAddress', 'Email Address'),
    enterEmail: t('login.enterEmail', 'Enter your email'),
    password: t('login.password', 'Password'),
    enterPassword: t('login.enterPassword', 'Enter your password'),
    signingIn: t('login.signingIn', 'Signing in...'),
    signInButton: t('login.signInButton', 'Sign In'),
    dontHaveAccount: t('login.dontHaveAccount', "Don't have an account?"),
    signUpHere: t('login.signUpHere', 'Sign up here'),
    orText: t('login.orText', 'or'),
    backToHome: t('login.backToHome', 'Back to Home')
  };

  // useTranslation hook will handle translations automatically

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Redirect based on user role
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Car size={40} />
          </div>
          <h1>{tKeys.welcomeBack}</h1>
          <p>{tKeys.signInText}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">
              <Mail size={18} />
              {tKeys.emailAddress}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={tKeys.enterEmail}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <Lock size={18} />
              {tKeys.password}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={tKeys.enterPassword}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? tKeys.signingIn : tKeys.signInButton}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {tKeys.dontHaveAccount}{' '}
            <Link to="/register" className="auth-link">
              {tKeys.signUpHere}
            </Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>{tKeys.orText}</span>
        </div>

        <Link to="/" className="btn btn-secondary btn-block">
          {tKeys.backToHome}
        </Link>
      </div>
    </div>
  );
};

export default Login;
