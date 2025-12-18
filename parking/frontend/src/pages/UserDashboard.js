import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import { MapPin, Calendar, Clock, TrendingUp, Car } from 'lucide-react';
import './Dashboard.css';
import { useAutoTranslate } from '../components/LanguageSwitcher';

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  const { tAsync, tSync, currentLanguage } = useAutoTranslate();
  const [t, setT] = useState({
    welcome: tSync('Welcome back'),
    subtitle: tSync("Here's what's happening with your parking today"),

    totalBookings: tSync('Total Bookings'),
    activeBookings: tSync('Active Bookings'),
    completed: tSync('Completed'),
    totalSpent: tSync('Total Spent'),
    recentBookings: tSync('Recent Bookings'),
    viewAll: tSync('View All'),
    noBookings: tSync('No bookings yet'),
    startParking: tSync('Start by finding a parking spot near you'),

    quickActions: tSync('Quick Actions'),
    myBookings: tSync('My Bookings'),

    completedLabel: tSync('Completed'),
  });

  useEffect(() => {
    fetchBookings();
  }, []);

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
}, [currentLanguage, t, tAsync]); // Added t and tAsync to dependencies

  const fetchBookings = async () => {
  try {
    console.log('Fetching bookings...');
    const response = await bookingAPI.getMyBookings();
    console.log('Bookings response:', response);
    
    if (!response.data) {
      console.error('No data in response:', response);
      return;
    }
    
    const bookingsData = response.data;
    console.log('Bookings data:', bookingsData); // Log the actual data
    
    setBookings(bookingsData.slice(0, 5));
    
    // Calculate stats from bookings data
    const calculatedStats = {
      totalBookings: bookingsData.length,
      activeBookings: bookingsData.filter(b => b.status === 'active' || b.status === 'confirmed').length,
      completedBookings: bookingsData.filter(b => b.status === 'completed').length,
      totalSpent: bookingsData.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    };
    setStats(calculatedStats);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  } finally {
    setLoading(false);
  }
};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#3b82f6',
      active: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{t.welcome}, {user?.name}! 👋</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="btn btn-primary" style={{opacity: 0.5, cursor: "not-allowed"}}>
            <MapPin size={20} />
Map View (Disabled)
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <Calendar size={32} color="#3b82f6" />
            </div>
            <div className="stat-content">
              <h3>{stats.totalBookings}</h3>
              <p>{t.totalBookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <Clock size={32} color="#10b981" />
            </div>
            <div className="stat-content">
              <h3>{stats.activeBookings}</h3>
              <p>{t.activeBookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff' }}>
              <Car size={32} color="#8b5cf6" />
            </div>
            <div className="stat-content">
              <h3>{stats.completedBookings}</h3>
              <p>{t.completedLabel}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <TrendingUp size={32} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <h3>₹{stats.totalSpent.toFixed(2)}</h3>
              <p>{t.totalSpent}</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{t.recentBookings}</h2>
            <div className="view-all-link">
              {t.viewAll} →
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <Car size={64} color="#d1d5db" />
              <h3>{t.noBookings}</h3>
              <p>{t.startParking}</p>
              <div className="btn btn-primary" style={{opacity: 0.5, cursor: "not-allowed"}}>
Map View (Disabled)
              </div>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-info">
                    <h3>{booking.parkingSlot?.name}</h3>
                    <p className="booking-address">
                      <MapPin size={16} />
                      {booking.parkingSlot?.address}
                    </p>
                    <div className="booking-details">
                      <span>
                        <Clock size={16} />
                        {formatDate(booking.startTime)}
                      </span>
                      <span>•</span>
                      <span>{booking.duration}h</span>
                      <span>•</span>
                      <span>{booking.vehicleNumber}</span>
                    </div>
                  </div>
                  <div className="booking-meta">
                    <span
                      className="booking-status"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status}
                    </span>
                    <div className="booking-price">₹{booking.totalPrice}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>{t.quickActions}</h2>
          <div className="action-grid">
            <div className="action-card" style={{opacity: 0.5, cursor: "not-allowed"}}>
              <MapPin size={32} />
              <h3>Map View (Disabled)</h3>
              <p>Map functionality is currently disabled</p>
            </div>
            <div className="action-card">
              <Calendar size={32} />
              <h3>{t.myBookings}</h3>
              <p>{t.viewAll}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
