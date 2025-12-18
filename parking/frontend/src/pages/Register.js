import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Mail, Lock, User, Phone, AlertCircle, UserCog } from 'lucide-react';
import './Auth.css';
import { useAutoTranslate } from '../components/LanguageSwitcher';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { tAsync, tSync, currentLanguage } = useAutoTranslate();

  const [t, setT] = useState({
    createAccount: tSync('Create Account'),
    joinText: tSync('Join ParkLink and start parking smarter'),
    fullName: tSync('Full Name'),
    enterFullName: tSync('Enter your full name'),
    emailAddress: tSync('Email Address'),
    enterEmail: tSync('Enter your email'),
    phoneNumber: tSync('Phone Number'),
    enterPhone: tSync('Enter your phone number'),
    accountType: tSync('Account Type'),
    userOption: tSync('User (Find & Book Parking)'),
    adminOption: tSync('Admin (Manage Parking Slots)'),
    password: tSync('Password'),
    createPassword: tSync('Create a password'),
    confirmPassword: tSync('Confirm Password'),
    confirmYourPassword: tSync('Confirm your password'),
    createAccountButton: tSync('Create Account'),
    creatingAccount: tSync('Creating Account...'),
    alreadyHave: tSync('Already have an account?'),
    signInHere: tSync('Sign in here'),
    orText: tSync('or'),
    backToHome: tSync('Back to Home')
  });

 useEffect(() => {
  let mounted = true;
  const translateAll = async () => {
    const keys = Object.keys(t);
    const translations = {};
    for (const k of keys) {
      translations[k] = await tAsync(t[k]);
    }
    if (mounted) setT(translations);
  };
  if (currentLanguage !== 'en') translateAll();
  return () => { mounted = false; };
}, [currentLanguage, t, tAsync]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

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
          <h1>{t.createAccount}</h1>
          <p>{t.joinText}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name">
              <User size={18} />
              {t.fullName}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.enterFullName}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">
              <Mail size={18} />
              {t.emailAddress}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.enterEmail}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone">
              <Phone size={18} />
              {t.phoneNumber}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t.enterPhone}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="role">
              <UserCog size={18} />
              {t.accountType}
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="user">{t.userOption}</option>
              <option value="admin">{t.adminOption}</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <Lock size={18} />
              {t.password}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t.createPassword}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              {t.confirmPassword}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t.confirmYourPassword}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t.creatingAccount : t.createAccountButton}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t.alreadyHave}{' '}
            <Link to="/login" className="auth-link">
              {t.signInHere}
            </Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>{t.orText}</span>
        </div>

        <Link to="/" className="btn btn-secondary btn-block">
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
};

export default Register;
