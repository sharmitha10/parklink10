import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    findParking: tSync('Find Parking'),
    totalBookings: tSync('Total Bookings'),
    activeBookings: tSync('Active Bookings'),
    completed: tSync('Completed'),
    totalSpent: tSync('Total Spent'),
    recentBookings: tSync('Recent Bookings'),
    viewAll: tSync('View All'),
    noBookings: tSync('No bookings yet'),
    startParking: tSync('Start by finding a parking spot near you'),
    findParkingNow: tSync('Find Parking Now'),
    quickActions: tSync('Quick Actions'),
    myBookings: tSync('My Bookings'),
    searchSpots: tSync('Search for available spots'),
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
  }, [currentLanguage]);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      const bookingsData = response.data;
      setBookings(bookingsData.slice(0, 5)); // Show last 5 bookings

      // Calculate stats
      const stats = {
        totalBookings: bookingsData.length,
        activeBookings: bookingsData.filter(b => b.status === 'active').length,
        completedBookings: bookingsData.filter(b => b.status === 'completed').length,
        totalSpent: bookingsData
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + b.totalPrice, 0),
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
          <Link to="/find-parking" className="btn btn-primary">
            <MapPin size={20} />
            {t.findParking}
          </Link>
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
            <Link to="/my-bookings" className="view-all-link">
              {t.viewAll} →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <Car size={64} color="#d1d5db" />
              <h3>{t.noBookings}</h3>
              <p>{t.startParking}</p>
              <Link to="/find-parking" className="btn btn-primary">
                {t.findParkingNow}
              </Link>
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
            <Link to="/find-parking" className="action-card">
              <MapPin size={32} />
              <h3>{t.findParking}</h3>
              <p>{t.searchSpots}</p>
            </Link>
            <Link to="/my-bookings" className="action-card">
              <Calendar size={32} />
              <h3>{t.myBookings}</h3>
              <p>{t.viewAll}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
