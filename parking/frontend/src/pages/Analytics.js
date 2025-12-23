import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, DollarSign, TrendingUp, ArrowLeft } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    bookings: [],
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,  // Added this line
    averagePrice: 0,    // Added this line
    averageOccupancy: 0,
  });
  const navigate = useNavigate();
  useEffect(() => {
      console.log('Analytics data updated:', analyticsData);
    }, [analyticsData]);
  // In Analytics.js, update the fetchAnalyticsData function
const fetchAnalyticsData = useCallback(async () => {
  try {
    setLoading(true);
    console.log('Fetching analytics...');
    const response = await bookingAPI.getAnalytics({ range: timeRange });
    console.log('Analytics response:', response);
    
    // Make sure we're accessing the data correctly from the response
    const { data } = response;
    console.log('Analytics data:', data);

    // Process the data for the chart
    const chartData = Array.isArray(data.bookings) ? data.bookings.map(booking => ({
      date: booking.startTime || booking.date,
      count: 1,
      revenue: booking.totalPrice || 0
    })) : [];

    setAnalyticsData({
      bookings: chartData,
      totalRevenue: data.totalRevenue || 0,
      totalBookings: data.totalBookings || 0,
      activeBookings: data.activeBookings || 0,
      averagePrice: data.averagePrice || 0,
      averageOccupancy: data.averageOccupancy || 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    setAnalyticsData(prev => ({
      ...prev,
      bookings: [],
      totalRevenue: 0,
      totalBookings: 0,
      activeBookings: 0,
      averagePrice: 0,
      averageOccupancy: 0
    }));
  } finally {
    setLoading(false);
  }
}, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatXAxis = (item) => {
    if (timeRange === 'day') {
      return new Date(item).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === 'week') {
      return new Date(item).toLocaleDateString([], { weekday: 'short' });
    } else {
      return new Date(item).toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1>Parking Analytics</h1>
        <div className="time-range-selector">
          <button 
            className={`time-range-btn ${timeRange === 'day' ? 'active' : ''}`}
            onClick={() => setTimeRange('day')}
          >
            <Clock size={16} /> Daily
          </button>
          <button 
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            <Calendar size={16} /> Weekly
          </button>
          <button 
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            <Calendar size={16} /> Monthly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading analytics data...</div>
      ) : (
        <>
          <div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon">
      <DollarSign />
    </div>
    <div className="stat-details">
      <h3>Total Revenue</h3>
      <p>₹{analyticsData.totalRevenue?.toFixed(2) || '0.00'}</p>
    </div>
  </div>
  <div className="stat-card">
    <div className="stat-icon">
      <Calendar />
    </div>
    <div className="stat-details">
      <h3>Total Bookings</h3>
      <p>{analyticsData.totalBookings}</p>
    </div>
  </div>
  <div className="stat-card">
    <div className="stat-icon">
      <TrendingUp />
    </div>
    <div className="stat-details">
      <h3>Active Bookings</h3>
      <p>{analyticsData.activeBookings}</p>
    </div>
  </div>
  <div className="stat-card">
    <div className="stat-icon">
      <DollarSign />
    </div>
    <div className="stat-details">
      <h3>Avg. Price</h3>
      <p>₹{analyticsData.averagePrice?.toFixed(2) || '0.00'}</p>
    </div>
  </div>
</div>

          <div className="chart-container">
            <h2>{timeRange === 'day' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}'s Bookings</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
            data={analyticsData.bookings}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fill: '#4a5568' }}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#4299e1" />
            <YAxis yAxisId="right" orientation="right" stroke="#48bb78" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Bookings') return [value, name];
                if (name === 'Revenue') return [`₹${value}`, name];
                return [value, name];
              }}
              labelFormatter={formatXAxis}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Bookings" fill="#4299e1" />
            <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#48bb78" />
          </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;