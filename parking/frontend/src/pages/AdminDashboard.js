import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, parkingAPI } from '../utils/api';
import { Users, MapPin, Calendar, DollarSign, TrendingUp, PlusCircle } from 'lucide-react';
import './Dashboard.css';
import { useAutoTranslate } from '../components/LanguageSwitcher';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalParkingSlots: 0,
    totalBookings: 0,
    activeBookings: 0,
  });
  const [mySlots, setMySlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const { tAsync, tSync, currentLanguage } = useAutoTranslate();
  const [t, setT] = useState({
    adminDashboard: tSync('Admin Dashboard'),
    manageBusiness: tSync('Manage your parking business in one place'),
    addNewSlot: tSync('Add New Slot'),
    totalUsers: tSync('Total Users'),
    myParkingSlots: tSync('My Parking Slots'),
    activeBookings: tSync('Active Bookings'),
    estRevenue: tSync('Est. Daily Revenue'),
    businessAnalytics: tSync('Business Analytics'),
    occupancyRate: tSync('Occupancy Rate'),
    occupancySubtitle: tSync('Current occupancy across all slots'),
    totalBookings: tSync('Total Bookings'),
    allTimeBookings: tSync('All-time bookings'),
    avgPrice: tSync('Average Price'),
    avgPriceSubtitle: tSync('Per hour across all slots'),
    myParkingSlotsHeader: tSync('My Parking Slots'),
    manageAll: tSync('Manage All'),
    noParkingSlots: tSync('No parking slots yet'),
    startAddingSlots: tSync('Start by adding your first parking area'),
    addParkingSlot: tSync('Add Parking Slot'),
    available: tSync('Available'),
    price: tSync('Price'),
    active: tSync('Active'),
    inactive: tSync('Inactive'),
    quickActions: tSync('Quick Actions'),
    manageSlots: tSync('Manage Slots'),
    manageSlotsDesc: tSync('Add, edit, or remove parking slots'),
    viewAnalytics: tSync('View Analytics'),
    checkRevenue: tSync('Check revenue and occupancy'),
  });

  useEffect(() => {
    fetchDashboardData();
    
    let mounted = true;
    const translateAll = async () => {
      const keys = Object.keys(t);
      const translations = {};
      for (const k of keys) {
        translations[k] = await tAsync(t[k]);
      }
      if (mounted) setT(translations);
    };
    
    if (currentLanguage !== 'en') {
      translateAll();
    }
    
    return () => { mounted = false; };
  }, [currentLanguage]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, slotsResponse] = await Promise.all([
        adminAPI.getDashboard(),
        parkingAPI.getMySlots(),
      ]);

      setStats(statsResponse.data);
      setMySlots(slotsResponse.data.slice(0, 5)); // Show first 5 slots
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = () => {
    // This is a simplified calculation. In production, fetch from backend
    return mySlots.reduce((sum, slot) => {
      return sum + (slot.totalSlots - slot.availableSlots) * slot.pricePerHour * 24; // Daily estimate
    }, 0);
  };

  const calculateOccupancy = () => {
    if (mySlots.length === 0) return 0;
    const totalSlots = mySlots.reduce((sum, slot) => sum + slot.totalSlots, 0);
    const occupiedSlots = mySlots.reduce((sum, slot) => sum + (slot.totalSlots - slot.availableSlots), 0);
    return ((occupiedSlots / totalSlots) * 100).toFixed(1);
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
            <h1>{t.adminDashboard} 🎯</h1>
            <p>{t.manageBusiness}</p>
          </div>
          <Link to="/admin/manage-slots" className="btn btn-primary">
            <PlusCircle size={20} />
            {t.addNewSlot}
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <Users size={32} color="#3b82f6" />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>{t.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <MapPin size={32} color="#10b981" />
            </div>
            <div className="stat-content">
              <h3>{mySlots.length}</h3>
              <p>{t.myParkingSlots}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f3e8ff' }}>
              <Calendar size={32} color="#8b5cf6" />
            </div>
            <div className="stat-content">
              <h3>{stats.activeBookings}</h3>
              <p>{t.activeBookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <DollarSign size={32} color="#f59e0b" />
            </div>
            <div className="stat-content">
              <h3>₹{stats.dailyRevenue?.toFixed(2) || '0'}</h3>
              <p>{t.estDailyRevenue}</p>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="dashboard-section">
          <h2>{t.businessAnalytics}</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-header">
                <TrendingUp size={24} color="#10b981" />
                <h3>{t.occupancyRate}</h3>
                <div className="progress-bar">
                  <div className="progress" style={{ width: `${calculateOccupancy()}%` }}></div>
                </div>
                <p>{calculateOccupancy()}%</p>
                <p className="text-muted">{t.occupancySubtitle}</p>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-header">
                <MapPin size={24} color="#8b5cf6" />
                <h3>{t.avgPrice}</h3>
                <h3>₹{stats.avgPrice || '0'}</h3>
                <p className="text-muted">{t.avgPriceSubtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Parking Slots */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{t.myParkingSlotsHeader}</h2>
            <Link to="/admin/manage-slots" className="view-all-link">
              {t.manageAll} →
            </Link>
          </div>

          {mySlots.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} className="text-muted" />
              <h3>{t.noParkingSlots}</h3>
              <p>{t.startAddingSlots}</p>
              <Link to="/admin/manage-slots" className="btn btn-primary mt-3">
                {t.addParkingSlot}
              </Link>
            </div>
          ) : (
            <div className="slots-grid">
              {mySlots.map((slot) => (
                <div key={slot._id} className="slot-card">
                  <div className="slot-header">
                    <h3>{slot.name}</h3>
                    <span
                      className="slot-status"
                      style={{
                        backgroundColor: slot.isActive ? '#10b981' : '#6b7280',
                      }}
                    >
                      {slot.isActive ? t.active : t.inactive}
                    </span>
                  </div>
                  <p className="slot-address">
                    <MapPin size={16} />
                    {slot.address}
                  </p>
                  <div className="slot-stats">
                    <div className="slot-stat">
                      <span className="stat-label">{t.available}</span>
                      <span className="stat-value">
                        {slot.availableSlots}/{slot.totalSlots}
                      </span>
                    </div>
                    <div className="slot-stat">
                      <span className="stat-label">{t.price}</span>
                      <span className="stat-value">₹{slot.pricePerHour}/hr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{t.quickActions}</h2>
          </div>
          <div className="action-grid">
            <Link to="/admin/manage-slots" className="action-card">
              <MapPin size={32} />
              <h3>{t.manageSlots}</h3>
              <p>{t.manageSlotsDesc}</p>
            </Link>
            <Link to="/admin/dashboard" className="action-card">
              <TrendingUp size={32} />
              <h3>{t.viewAnalytics}</h3>
              <p>{t.checkRevenue}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
