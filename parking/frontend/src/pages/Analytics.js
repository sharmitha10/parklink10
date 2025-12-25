// In frontend/src/pages/Analytics.js
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { bookingAPI } from '../utils/api';
import './Analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    bookings: [],
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    averagePrice: 0,
    currentOccupancy: 0
  });

  const fetchAnalyticsData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await bookingAPI.getAnalytics({ range: timeRange });
    
    if (response.data?.data) {
      const { chartData, stats } = response.data.data;
      
      // Transform the data for the chart
      const transformedData = chartData.map(item => ({
        name: item.name,
        bookings: Number(item.bookings) || 0,
        revenue: Number(item.revenue) || 0
      }));

      setAnalyticsData({
        bookings: transformedData,
        totalRevenue: Number(stats.totalRevenue) || 0,
        totalBookings: Number(stats.totalBookings) || 0,
        activeBookings: Number(stats.activeBookings) || 0,
        averagePrice: Number(stats.averagePrice) || 0,
        currentOccupancy: Number(stats.currentOccupancy) || 0
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  } finally {
    setLoading(false);
  }
}, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, timeRange]);

  // Format tooltip based on time range
  // const formatTooltip = (value, name) => {
  //   if (name === 'revenue') {
  //     return [`₹${Number(value).toFixed(2)}`, 'Revenue'];
  //   }
  //   return [value, 'Bookings'];
  // };

  // Format x-axis label based on time range
  // const formatXAxis = (tick) => {
  //   if (timeRange === 'day') {
  //     return tick;
  //   } else if (timeRange === 'week') {
  //     return tick;
  //   }
  //   return tick;
  // };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">Booking Analytics</h1>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'day' ? 'active' : ''}`}
            onClick={() => setTimeRange('day')}
          >
            Today
          </button>
          <button
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="value">{analyticsData.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="value currency">₹{analyticsData.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Active Bookings</h3>
          <p className="value">{analyticsData.activeBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Average Price</h3>
          <p className="value">₹{analyticsData.averagePrice.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Current Occupancy</h3>
          <p className="value">{analyticsData.currentOccupancy}%</p>
        </div>
      </div>

      <div className="chart-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
  data={analyticsData.bookings}
  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis 
    dataKey="name"
    angle={-45}
    textAnchor="end"
    height={60}
    tick={{ fontSize: 12 }}
  />
  <YAxis yAxisId="left" />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip 
    formatter={(value) => {
        if (value === 'bookings') return 'Bookings';
        if (value === 'revenue') return 'Revenue (₹)';
        return value;
      }}
  />
  <Legend />
  <Bar
    yAxisId="left"
    dataKey="bookings"
    name="Bookings"
    fill="#4299e1"
    barSize={20}
  />
  <Bar
    yAxisId="right"
    dataKey="revenue"
    name="Revenue (₹)"
    fill="#48bb78"
    barSize={20}
  />
</BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;