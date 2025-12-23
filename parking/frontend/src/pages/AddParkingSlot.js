import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';  // Removed useNavigate since it's not used
import { parkingAPI } from '../utils/api';     // Import the parkingAPI object
import './AddParkingSlot.css';

const AddParkingSlot = ({ onSuccess, onClose, isEditMode = false }) => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    totalSlots: 1,
    pricePerHour: 50,
    amenities: {
      cctv: false,
    security: false,
    covered: false,
    evCharging: false,
    wheelchairAccess: false,
    lighting: false,
    restroom: false,
    washArea: false,
    },
    slotDimensions: {
      length: 18,  // Default to standard car size
      width: 9,    // in feet
      height: 0    // 0 means no height restriction
    }
  });

  // Vehicle type presets
  const VEHICLE_PRESETS = [
    { name: 'Motorcycle', dimensions: { length: 8, width: 4, height: 0 } },
    { name: 'Compact Car', dimensions: { length: 16, width: 8, height: 0 } },
    { name: 'Standard Car', dimensions: { length: 18, width: 9, height: 0 } },
    { name: 'Large Vehicle', dimensions: { length: 20, width: 10, height: 0 } },
    { name: 'Truck/Bus', dimensions: { length: 40, width: 12, height: 0 } },
    { name: 'Custom', dimensions: { length: 0, width: 0, height: 0 } }
  ];

  const FACILITIES = [
  { id: 'cctv', label: 'CCTV' },
  { id: 'security', label: '24/7 Security' },
  { id: 'covered', label: 'Covered Parking' },
  { id: 'evCharging', label: 'EV Charging' },
  { id: 'wheelchairAccess', label: 'Wheelchair Access' },
  { id: 'lighting', label: '24/7 Lighting' },
  { id: 'restroom', label: 'Restroom' },
  { id: 'washArea', label: 'Car Wash Area' }
];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Handle vehicle type selection
  const handleVehicleTypeChange = (e) => {
    const selectedType = VEHICLE_PRESETS.find(preset => preset.name === e.target.value);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        slotDimensions: {
          ...prev.slotDimensions,
          ...selectedType.dimensions
        }
      }));
    }
  };

  const getCurrentLocation = () => {
  setIsLocationLoading(true);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Failed to retrieve current location. Please enter manually.');
        setIsLocationLoading(false);
      }
    );
  } else {
    setError('Geolocation is not supported by your browser');
    setIsLocationLoading(false);
  }
};

  // Handle form input changes
  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  if (FACILITIES.some(f => f.id === name)) {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [name]: checked
      }
    }));
  } else if (name in formData) {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  }
};
  // Handle form submission
 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const slotData = {
      name: formData.name,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      totalSlots: formData.totalSlots,
      pricePerHour: formData.pricePerHour,
      amenities: Object.keys(formData.amenities).filter(key => formData.amenities[key]),
      slotDimensions: {
        length: parseFloat(formData.slotDimensions.length) || 0,
        width: parseFloat(formData.slotDimensions.width) || 0,
        height: parseFloat(formData.slotDimensions.height) || 0
      }
    };
    
    console.log('Sending slot data:', slotData);
    
    if (isEditMode) {
      await parkingAPI.update(id, slotData);
      onSuccess('Parking slot updated successfully');
    } else {
      await parkingAPI.create(slotData);
      onSuccess('Parking slot created successfully');
      // Reset form after successful submission
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        totalSlots: 1,
        pricePerHour: 50,
        amenities: {
          cctv: false,
          security: false,
          covered: false,
          evCharging: false
        },
        slotDimensions: {
          length: 18,
          width: 9,
          height: 0
        }
      });
    }
    onClose();
  } catch (error) {
    console.error('Error saving parking slot:', error);
    setError(error.response?.data?.message || 'Failed to save parking slot. Please check your input and try again.');
  } finally {
    setLoading(false);
  }
};
  // Fetch slot details when in edit mode
  useEffect(() => {
    const fetchSlotDetails = async () => {
      if (!isEditMode || !id) return;
      
      try {
        setLoading(true);
        const data = await parkingAPI.getById(id);
        setFormData(prev => ({
          ...prev,
          ...data,
          // Ensure slotDimensions exists and has default values if not present
          slotDimensions: data.slotDimensions || { length: 18, width: 9, height: 0 }
        }));
      } catch (error) {
        console.error('Error fetching slot details:', error);
        setError('Failed to load parking slot details');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotDetails();
  }, [id, isEditMode]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="add-parking-slot-container">
      <h2>{isEditMode ? 'Edit Parking Slot' : 'Add New Parking Slot'}</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Existing form fields */}
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="form-control"
            rows="3"
          ></textarea>
        </div>

        <div className="form-row">
  <div className="form-group">
    <label htmlFor="latitude">Latitude</label>
    <input
      type="number"
      id="latitude"
      name="latitude"
      value={formData.latitude}
      onChange={handleChange}
      step="any"
      required
      className="form-control"
    />
  </div>
  <div className="form-group">
    <label htmlFor="longitude">Longitude</label>
    <input
      type="number"
      id="longitude"
      name="longitude"
      value={formData.longitude}
      onChange={handleChange}
      step="any"
      required
      className="form-control"
    />
  </div>
  <button
    type="button"
    onClick={getCurrentLocation}
    disabled={isLocationLoading}
    className="btn-location"
  >
    {isLocationLoading ? 'Getting Location...' : 'Get Current Location'}
  </button>
</div>
        <div className="form-row">
          <div className="form-group">
            <label>Total Slots</label>
            <input
              type="number"
              min="1"
              name="totalSlots"
              value={formData.totalSlots}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Price per Hour (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        
        {/* <div className="form-group">
          <label>Amenities</label>
          <div className="amenities-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="cctv"
                checked={formData.amenities.cctv}
                onChange={handleChange}
              />
              <span className="custom-checkbox"></span>
              <span>CCTV</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="security"
                checked={formData.amenities.security}
                onChange={handleChange}
              />
              <span className="custom-checkbox"></span>
              <span>24/7 Security</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="covered"
                checked={formData.amenities.covered}
                onChange={handleChange}
              />
              <span className="custom-checkbox"></span>
              <span>Covered</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="evCharging"
                checked={formData.amenities.evCharging}
                onChange={handleChange}
              />
              <span className="custom-checkbox"></span>
              <span>EV Charging</span>
            </label>
          </div>
        </div> */}

        {/* Vehicle Type and Slot Dimensions */}
        <div className="form-group">
          <label>Vehicle Type Preset</label>
          <select 
            className="form-control"
            onChange={handleVehicleTypeChange}
            value={VEHICLE_PRESETS.find(preset => 
              preset.dimensions.length === formData.slotDimensions.length &&
              preset.dimensions.width === formData.slotDimensions.width
            )?.name || 'Custom'}
          >
            {VEHICLE_PRESETS.map(preset => (
              <option key={preset.name} value={preset.name}>
                {preset.name} {preset.dimensions.length > 0 ? 
                  `(${preset.dimensions.length}' x ${preset.dimensions.width}')` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Slot Length (feet)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="0.1"
              value={formData.slotDimensions.length}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                slotDimensions: {
                  ...prev.slotDimensions,
                  length: parseFloat(e.target.value) || 0
                }
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Slot Width (feet)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="0.1"
              value={formData.slotDimensions.width}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                slotDimensions: {
                  ...prev.slotDimensions,
                  width: parseFloat(e.target.value) || 0
                }
              }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Height Clearance (feet, 0 = no restriction)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="0.1"
              value={formData.slotDimensions.height}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                slotDimensions: {
                  ...prev.slotDimensions,
                  height: parseFloat(e.target.value) || 0
                }
              }))}
            />
          </div>
        </div>
        <div className="form-group">
  <label>Facilities</label>
  <div className="facilities-grid">
    {FACILITIES.map(facility => (
      <label key={facility.id} className="facility-item">
        <input
          type="checkbox"
          name={facility.id}
          checked={formData.amenities[facility.id] || false}
          onChange={handleChange}
        />
        <span className="custom-checkbox"></span>
        <span className="facility-label">{facility.label}</span>
      </label>
    ))}
  </div>
</div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Add')} Parking Slot
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddParkingSlot;