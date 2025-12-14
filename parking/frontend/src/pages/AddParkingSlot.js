import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parkingAPI } from '../utils/api';
import { MapPin, X, Check, AlertCircle } from 'lucide-react';
import './AddParkingSlot.css';

const AddParkingSlot = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    totalSlots: 10,
    pricePerHour: 50,
    amenities: {
      cctv: false,
      security: false,
      covered: false,
      evCharging: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const isEditMode = Boolean(id);

  useEffect(() => {
    const fetchSlotDetails = async () => {
      if (!isEditMode) {
        setLoading(false);
        return; // No need to fetch for new slot
      }

      try {
        setLoading(true);
        const response = await parkingAPI.getById(id);
        const slot = response.data;
        
        // Check if location exists and has coordinates
        const latitude = slot.location?.coordinates?.[1] || '';
        const longitude = slot.location?.coordinates?.[0] || '';
        
        setFormData({
          name: slot.name || '',
          address: slot.address || '',
          latitude: latitude,
          longitude: longitude,
          totalSlots: slot.totalSlots || 10,
          pricePerHour: slot.pricePerHour || 50,
          amenities: {
            cctv: slot.amenities?.cctv || false,
            security: slot.amenities?.security || false,
            covered: slot.amenities?.covered || false,
            evCharging: slot.amenities?.evCharging || false
          }
        });
      } catch (error) {
        console.error('Error fetching slot details:', error);
        setError(error.response?.data?.message || 'Failed to load slot details');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotDetails();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name in formData.amenities) {
      setFormData(prev => ({
        ...prev,
        amenities: {
          ...prev.amenities,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const getCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLoading(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        console.error('Geolocation error:', error);
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the data to send to the server
      const slotData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        totalSlots: parseInt(formData.totalSlots, 10) || 10,
        pricePerHour: parseFloat(formData.pricePerHour) || 50,
        amenities: Object.entries(formData.amenities)
          .filter(([_, value]) => value)
          .map(([key]) => key),
        operatingHours: {
          open: '00:00',
          close: '23:59'
        }
      };
      
      console.log('Submitting slot data:', JSON.stringify(slotData, null, 2));
      
      // Make the API call without expecting a specific response structure
      if (isEditMode) {
        await parkingAPI.update(id, slotData);
      } else {
        await parkingAPI.create(slotData);
      }
      
      // If we get here, the request was successful
      navigate('/admin/manage-slots');
      
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} parking slot:`, err);
      
      // Simplified error handling
      let errorMessage = 'An error occurred while processing your request.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = err.response;
        console.error('Error response:', { status, data });
        
        errorMessage = data?.message || 
                      (status === 400 && 'Invalid data provided') ||
                      (status === 401 && 'Please log in to continue') ||
                      (status === 403 && 'You do not have permission to perform this action') ||
                      (status === 404 && 'The requested resource was not found') ||
                      (status >= 500 && 'Server error. Please try again later.') ||
                      'An unexpected error occurred';
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="add-parking-slot">
      <div className="add-slot-container">
        <div className="add-slot-header">
          <h1>{isEditMode ? 'Edit Parking Slot' : 'Add New Parking Slot'}</h1>
          <button 
            className="btn-close"
            onClick={() => navigate('/admin/manage-slots')}
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="slot-form">
          <div className="form-group">
            <label>Parking Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Downtown Parking"
              required
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <div className="input-with-icon">
              <MapPin size={18} className="input-icon" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full address"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g., 12.9716"
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude *</label>
              <div className="input-with-button">
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 77.5946"
                  required
                />
                <button 
                  type="button" 
                  className="btn-location"
                  onClick={getCurrentLocation}
                  disabled={loading}
                >
                  {loading ? 'Locating...' : 'Use My Location'}
                </button>
              </div>
              {locationError && <p className="error-text">{locationError}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Slots</label>
              <input
                type="number"
                name="totalSlots"
                min="1"
                value={formData.totalSlots}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Price per Hour (₹)</label>
              <input
                type="number"
                name="pricePerHour"
                min="0"
                step="0.01"
                value={formData.pricePerHour}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Amenities</label>
            <div className="amenities-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="cctv"
                  checked={formData.amenities.cctv}
                  onChange={handleChange}
                />
                <span>CCTV</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="security"
                  checked={formData.amenities.security}
                  onChange={handleChange}
                />
                <span>24/7 Security</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="covered"
                  checked={formData.amenities.covered}
                  onChange={handleChange}
                />
                <span>Covered Parking</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="evCharging"
                  checked={formData.amenities.evCharging}
                  onChange={handleChange}
                />
                <span>EV Charging</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/manage-slots')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Parking Slot' : 'Save Parking Slot')}
              {!loading && <Check size={18} style={{ marginLeft: '8px' }} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParkingSlot;
