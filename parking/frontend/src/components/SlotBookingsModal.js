import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { X, Clock, User, Calendar, Car, DollarSign } from 'lucide-react';

const SlotBookingsModal = ({ slot, show, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!show || !slot?._id) return;
      
      setLoading(true);
      try {
        const response = await adminAPI.getSlotBookings(slot._id);
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching slot bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [show, slot]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Bookings for {slot?.name}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings">No bookings found for this slot.</div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    <div className="user-info">
                      <User size={16} />
                      <span>{booking.user?.name || 'N/A'}</span>
                      <span className="text-muted">({booking.user?.email})</span>
                    </div>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-details">
                    <div className="detail">
                      <Calendar size={16} />
                      <span>{formatDate(booking.startTime)}</span>
                    </div>
                    
                    <div className="detail">
                      <Clock size={16} />
                      <span>
                        {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} -{' '}
                        {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <div className="detail">
                      <Car size={16} />
                      <span>{booking.vehicleNumber} • {booking.vehicleType}</span>
                    </div>
                    
                    <div className="detail">
                      <DollarSign size={16} />
                      <span className="price">₹{booking.totalPrice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotBookingsModal;