import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../utils/api';
import { MapPin, Calendar, Clock, Car, XCircle, CheckCircle, Navigation } from 'lucide-react';
import './MyBookings.css';
import { useGoogleTranslate } from '../components/LanguageSwitcher';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { translateText, currentLanguage } = useGoogleTranslate();

  const [t, setT] = useState({
    myBookings: 'My Bookings',
    totalBookings: 'total booking',
    all: 'All',
    confirmed: 'Confirmed',
    active: 'Active',
    completed: 'Completed',
    noBookingsFound: 'No bookings found',
    noBookingsYet: "You haven't made any bookings yet",
    startLabel: 'Start',
    endLabel: 'End',
    vehicleLabel: 'Vehicle',
    durationLabel: 'Duration',
    totalAmount: 'Total Amount',
    navigate: 'Navigate',
    cancel: 'Cancel',
    complete: 'Complete',
    confirmCancel: 'Are you sure you want to cancel this booking?',
    bookingCancelled: 'Booking cancelled successfully',
    bookingCompleted: 'Booking completed successfully',
  });

  useEffect(() => {
    const translateAll = async () => {
      const keys = Object.keys(t);
      const translations = {};
      for (const k of keys) {
        translations[k] = await translateText(t[k]);
      }
      setT(translations);
    };
    if (currentLanguage && currentLanguage !== 'en') translateAll();
  }, [currentLanguage]);

  useEffect(() => {
  const loadBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      const filteredBookings = response.data.filter(booking => {
        if (filter === 'all') return true;
        return booking.status === filter;
      });
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  loadBookings();
}, [filter]);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancel(bookingId);
        alert('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await bookingAPI.complete(bookingId);
      alert('Booking completed successfully');
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete booking');
    }
  };

  const navigateToSlot = (coordinates) => {
    const [lng, lat] = coordinates;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const getBookingStatus = (booking) => {
    // If booking is already completed or cancelled, return as is
    if (['completed', 'cancelled'].includes(booking.status)) {
      return booking.status;
    }
    
    // Check if current time is past the booking end time
    const now = new Date();
    const endTime = new Date(booking.endTime);
    
    if (now > endTime) {
      return 'completed';
    }
    
    return booking.status;
  };

  const filteredBookings = bookings.map(booking => ({
    ...booking,
    displayStatus: getBookingStatus(booking)
  })).filter((booking) => {
    if (filter === 'all') return true;
    return booking.displayStatus === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#3b82f6',
      active: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <div className="bookings-container">
        <div className="bookings-header">
          <h1>{t.myBookings}</h1>
          <p>{bookings.length} {bookings.length !== 1 ? t.totalBookings + 's' : t.totalBookings}</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t.all} ({bookings.length})
          </button>
          <button
            className={`tab ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            {t.confirmed} ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            className={`tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            {t.active} ({bookings.filter(b => b.status === 'active').length})
          </button>
          <button
            className={`tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            {t.completed} ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <Calendar size={64} color="#d1d5db" />
            <h3>{t.noBookingsFound}</h3>
            <p>
                {filter === 'all'
                  ? t.noBookingsYet
                  : `No ${filter} bookings`}
              </p>
          </div>
        ) : (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-header">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(booking.displayStatus || booking.status) }}
                  >
                    {booking.displayStatus || booking.status}
                  </span>
                  <span className="booking-id">#{booking._id.slice(-6)}</span>
                </div>

                <h3>{booking.parkingSlot?.name}</h3>
                <p className="location">
                  <MapPin size={16} />
                  {booking.parkingSlot?.address}
                </p>

                <div className="booking-details-grid">
                  <div className="detail-item">
                    <Calendar size={20} color="#667eea" />
                    <div>
                          <span className="label">{t.startLabel}</span>
                      <span className="value">{formatDate(booking.startTime)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Clock size={20} color="#667eea" />
                    <div>
                        <span className="label">{t.endLabel}</span>
                      <span className="value">{formatDate(booking.endTime)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Car size={20} color="#667eea" />
                    <div>
                        <span className="label">{t.vehicleLabel}</span>
                      <span className="value">{booking.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <CheckCircle size={20} color="#667eea" />
                    <div>
                        <span className="label">{t.durationLabel}</span>
                      <span className="value">{booking.duration}h</span>
                    </div>
                  </div>
                </div>

                <div className="booking-footer">
                  <div className="price-section">
                    <span className="price-label">{t.totalAmount}</span>
                    <span className="price">₹{booking.totalPrice}</span>
                  </div>

                  <div className="action-buttons">
                    {booking.parkingSlot?.location && (
                        <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigateToSlot(booking.parkingSlot.location.coordinates)}
                      >
                        <Navigation size={16} />
                        {t.navigate}
                      </button>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        <XCircle size={16} />
                        {t.cancel}
                      </button>
                    )}

                    {booking.status === 'active' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleCompleteBooking(booking._id)}
                      >
                        <CheckCircle size={16} />
                        {t.complete}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
