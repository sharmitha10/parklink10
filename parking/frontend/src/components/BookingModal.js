import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { bookingAPI } from '../utils/api';
import { X, AlertCircle, Check, Star, CheckCircle } from 'lucide-react';
import ReviewModal from './ReviewModal';
import './BookingModal.css';

// Add inline styles for the new UI components
const styles = {
  headerContent: {
    flex: 1,
  },
  slotAvailability: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  price: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
  },
  available: {
    fontSize: '14px',
    color: '#6b7280',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  dateTimePicker: {
    width: '100%',
  },
  pricingDetails: {
    marginTop: '12px',
  },
  pricingHighlight: {
    color: '#6366f1',
    fontWeight: 500,
  },
  pricingTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
};

const BookingModal = ({ slot, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    startTime: '',
    endTime: '',
  });
  const [pricing, setPricing] = useState({
    duration: 0,
    basePrice: 0,
    totalPrice: 0,
    dynamicMultiplier: 1.0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({ canReview: false, hasReviewed: false });
  const [isBookingCompleted, setIsBookingCompleted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Check if booking end time has been reached
  useEffect(() => {
    if (!formData.endTime) return;
    
    const checkBookingCompletion = () => {
      const now = new Date();
      const endTime = new Date(formData.endTime);
      
      if (now >= endTime && !isBookingCompleted) {
        setIsBookingCompleted(true);
      } else if (now < endTime && isBookingCompleted) {
        setIsBookingCompleted(false);
      }
    };
    
    checkBookingCompletion();
    const intervalId = setInterval(checkBookingCompletion, 60000);
    return () => clearInterval(intervalId);
  }, [formData.endTime, isBookingCompleted]);

  useEffect(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60000);

    setFormData(prev => ({
      ...prev,
      startTime: formatDateTime(startTime),
      endTime: formatDateTime(endTime),
    }));
  }, []);

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (date) => {
    const holidays = ['01-01', '07-04', '12-25'];
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  };

  const getSeasonalMultiplier = (date) => {
    const month = date.getMonth() + 1;
    if ((month >= 6 && month <= 8) || month === 12) return 1.2;
    if ((month >= 3 && month <= 5) || (month >= 9 && month <= 11)) return 1.0;
    return 0.9;
  };

  const getDemandMultiplier = (slot) => {
    if (!slot || !slot.availableSlots || !slot.totalSlots || slot.totalSlots === 0) {
      return 1.0; // Default to no multiplier if data is missing
    }
    
    const occupancyRate = 1 - (slot.availableSlots / slot.totalSlots);
    
    // High demand: >80% occupied
    if (occupancyRate > 0.8) {
      return 1.4 + (Math.random() * 0.2); // 1.4x - 1.6x
    } 
    // Medium demand: 50-80% occupied
    else if (occupancyRate > 0.5) {
      return 1.1 + (Math.random() * 0.2); // 1.1x - 1.3x
    }
    // Low demand: <50% occupied
    else {
      return 0.9 + (Math.random() * 0.2); // 0.9x - 1.1x
    }
  };

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60));

      if (duration > 0) {
        const hour = start.getHours();
        let timeMultiplier = 1.0;
        let pricingInfo = [];

        if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20)) {
          timeMultiplier = 1.5;
          pricingInfo.push('Peak hours (1.5x)');
        } else if (hour >= 22 || hour < 6) {
          timeMultiplier = 0.8;
          pricingInfo.push('Off-peak hours (0.8x)');
        } else {
          pricingInfo.push('Standard hours (1.0x)');
        }

        const weekendMultiplier = isWeekend(start) ? 1.2 : 1.0;
        if (isWeekend(start)) pricingInfo.push('Weekend (1.2x)');

        const holidayMultiplier = isHoliday(start) ? 1.3 : 1.0;
        if (isHoliday(start)) pricingInfo.push('Holiday (1.3x)');

        const seasonalMultiplier = getSeasonalMultiplier(start);
        if (seasonalMultiplier !== 1.0) {
          pricingInfo.push(seasonalMultiplier > 1 ? 
            `Peak season (${seasonalMultiplier.toFixed(1)}x)` :
            `Off-season (${seasonalMultiplier.toFixed(1)}x)`);
        }

        const demandMultiplier = getDemandMultiplier(slot);
        if (demandMultiplier > 1.1) {
          pricingInfo.push(`High demand (${demandMultiplier.toFixed(1)}x)`);
        } else if (demandMultiplier < 0.95) {
          pricingInfo.push(`Low demand (${demandMultiplier.toFixed(1)}x)`);
        }

        const totalMultiplier = Math.min(
          timeMultiplier * weekendMultiplier * holidayMultiplier * 
          seasonalMultiplier * demandMultiplier, 
          2.0
        );
        
        const basePrice = slot.pricePerHour * duration;
        const totalPrice = basePrice * totalMultiplier;

        setPricing({
          duration,
          basePrice,
          totalPrice,
          dynamicMultiplier: totalMultiplier,
          pricingInfo: pricingInfo.length > 0 ? pricingInfo : ['Standard rate']
        });
      }
    }
  }, [formData.startTime, formData.endTime, slot.pricePerHour]);

  const formatDateTime = (date) => {
    const pad = num => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatTimeDisplay = (dateTimeString) => {
    if (!dateTimeString) return { time: '', ampm: '' };
    const date = new Date(dateTimeString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12;
    return {
      time: `${hours}:${minutes} ${ampm}`,
      ampm: ''
    };
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if ((name === 'endTime' && value < formData.startTime) || 
        (name === 'startTime' && formData.endTime && value > formData.endTime)) {
      setError('End time must be after start time');
    } else if (error) {
      setError('');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReviewSubmit = async () => {
    try {
      setIsSubmittingReview(true);
      await bookingAPI.post('/reviews', {
        rating,
        review: reviewText,
        parkingSlotId: slot._id,
        bookingId: localStorage.getItem('lastBookingId')
      });
      setReviewStatus({ canReview: false, hasReviewed: true });
      setShowReview(false);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form data
    if (!formData.vehicleNumber) {
      setError('Please enter vehicle number');
      setLoading(false);
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Please select start and end time');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        setPaymentSuccess(true);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({
            _id: 'mock_booking_id_' + Date.now(),
            ...formData,
            totalPrice: pricing.totalPrice,
            paymentStatus: 'completed',
            status: 'confirmed',
            slot: {
              _id: slot._id,
              name: slot.name
            }
          });
        }
      }, 3000);
      
    } catch (err) {
      setError('Failed to process booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderReviewForm = () => (
    <div style={{ padding: '30px' }}>
      <h2>Leave a Review</h2>
      <div style={{ margin: '15px 0' }}>
        <h3>How was your experience?</h3>
        <div style={{ display: 'flex', gap: '5px', margin: '15px 0', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={24} 
              fill={star <= rating ? '#f59e0b' : 'none'} 
              color="#f59e0b" 
              onClick={() => setRating(star)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience..."
          style={{ 
            width: '100%', 
            minHeight: '100px', 
            padding: '10px', 
            border: '1px solid #e2e8f0', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowReview(false)}
            style={buttonStyles.secondary}
            disabled={isSubmittingReview}
          >
            Cancel
          </button>
          <button 
            onClick={handleReviewSubmit}
            disabled={isSubmittingReview || rating === 0}
            style={{
              ...buttonStyles.primary,
              opacity: (isSubmittingReview || rating === 0) ? 0.7 : 1,
              cursor: (isSubmittingReview || rating === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <CheckCircle size={64} color="#10b981" />
      <h2 style={{ color: '#10b981', margin: '15px 0 10px' }}>Booking Confirmed!</h2>
      <p style={{ marginBottom: '25px' }}>Your parking spot has been reserved successfully.</p>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          onClick={() => setShowReview(true)}
          style={buttonStyles.primary}
        >
          Leave a Review
        </button>
        <button 
          onClick={onClose}
          style={buttonStyles.secondary}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );

  const buttonStyles = {
    primary: {
      padding: '10px 20px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      minWidth: '150px'
    },
    secondary: {
      padding: '10px 20px',
      backgroundColor: '#e5e7eb',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      minWidth: '150px'
    }
  };

  if (paymentSuccess && !showReview) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {renderSuccessMessage()}
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          {renderReviewForm()}
        </div>
      </div>
    );
  }

  // Use existing pricing from the state which is already calculated in the useEffect
  const { dynamicMultiplier = 1, pricingInfo = [] } = pricing || {};
  const basePrice = slot?.pricePerHour || 60;
  const dynamicPrice = basePrice * dynamicMultiplier;
  const pricingItems = Array.isArray(pricingInfo) ? pricingInfo : [];

  return (
    <div className="booking-container">
      <div className="booking-header">
        <div className="header-content">
          <h1>{slot?.name || 'Parking Slot'}</h1>
          <div className="header-details">
            <span className="price">₹{dynamicPrice.toFixed(0)}/hr</span>
            <span className="divider">•</span>
            <span className="multiplier">{dynamicMultiplier.toFixed(1)}x</span>
            <span className="divider">•</span>
            <span className="slots-available">{slot?.availableSlots || '50'} slots available</span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="booking-form">
        <div className="form-section">
          <div className="form-group">
            <label>VEHICLE NUMBER</label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="Enter vehicle number"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>VEHICLE TYPE</label>
            <div className="select-wrapper">
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
              </select>
              <div className="select-arrow">▼</div>
            </div>
          </div>

          <div className="time-selection">
            <div className="form-group">
              <label>START TIME</label>
              <div className="time-input-container">
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleTimeChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="time-input"
                />
                <div className="time-display">
                  <span className="date">{new Date(formData.startTime).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric'})}</span>
                  <span className="time">{formatTimeDisplay(formData.startTime).time}</span>
                </div>
                <div className="calendar-icon">📅</div>
              </div>
            </div>

            <div className="form-group">
              <label>END TIME</label>
              <div className="time-input-container">
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleTimeChange}
                  required
                  min={formData.startTime || new Date().toISOString().slice(0, 16)}
                  className="time-input"
                />
                <div className="time-display">
                  <span className="date">{new Date(formData.endTime).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric'})}</span>
                  <span className="time">{formatTimeDisplay(formData.endTime).time}</span>
                </div>
                <div className="calendar-icon">📅</div>
              </div>
            </div>
          </div>

          <div className="pricing-summary">
            <h3>Pricing Summary</h3>
            <div className="pricing-details">
              <div className="pricing-row">
                <span>Duration</span>
                <span>{pricing.duration} hours</span>
              </div>
              <div className="pricing-row">
                <span>Base Rate</span>
                <span>₹{basePrice}/hr</span>
              </div>
              {pricingItems.map((info, index) => (
                <div key={index} className="pricing-row highlight">
                  <span>{info.split(' (')[0]}</span>
                  <span>{info.match(/\(([^)]+)\)/)?.[1] || ''}</span>
                </div>
              ))}
              <div className="pricing-total">
                <span>Total Rate</span>
                <span>₹{dynamicPrice.toFixed(2)}/hr</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-methods" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#4b5563' }}>Select Payment Method</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <label style={{
                  flex: 1,
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'card' ? '#f0fdf4' : 'white',
                  borderColor: paymentMethod === 'card' ? '#10b981' : '#e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      style={{ marginRight: '8px' }}
                    />
                    <span>Credit/Debit Card</span>
                  </div>
                </label>
                <label style={{
                  flex: 1,
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'upi' ? '#f0fdf4' : 'white',
                  borderColor: paymentMethod === 'upi' ? '#10b981' : '#e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      style={{ marginRight: '8px' }}
                    />
                    <span>UPI</span>
                  </div>
                </label>
                <label style={{
                  flex: 1,
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  backgroundColor: paymentMethod === 'netbanking' ? '#f0fdf4' : 'white',
                  borderColor: paymentMethod === 'netbanking' ? '#10b981' : '#e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="netbanking"
                      checked={paymentMethod === 'netbanking'}
                      onChange={() => setPaymentMethod('netbanking')}
                      style={{ marginRight: '8px' }}
                    />
                    <span>Net Banking</span>
                  </div>
                </label>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    color: '#4b5563'
                  }}>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    color: '#4b5563'
                  }}>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                color: '#4b5563'
              }}>
                <p>UPI ID: demo@example.com</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Please complete the payment using your preferred UPI app</p>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                color: '#4b5563'
              }}>
                <p>Bank: Demo Bank</p>
                <p>Account: XXXX-XXXX-1234</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Please complete the payment through your bank</p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#4b5563',
                  marginRight: '12px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '150px'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      borderTopColor: 'white',
                      animation: 'spin 1s ease-in-out infinite',
                      marginRight: '8px'
                    }}></span>
                    Processing...
                  </>
                ) : (
                  `Pay Now ₹${pricing.totalPrice.toFixed(2)}`
                )}
              </button>
            </div>
            
            <style>{
              `@keyframes spin { to { transform: rotate(360deg); } }`
            }</style>
          </form>
          
          {showSuccessPopup && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              textAlign: 'center',
              width: '90%',
              maxWidth: '400px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Check size={32} color="#10b981" />
              </div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '8px',
                color: '#111827'
              }}>Payment Successful!</h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '24px'
              }}>Your booking has been confirmed.</p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;