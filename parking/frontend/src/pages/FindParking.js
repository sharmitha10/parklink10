import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parkingAPI } from '../utils/api';
import { useAutoTranslate } from '../components/LanguageSwitcher';
import BookingModal from '../components/BookingModal';
import CustomMap from '../components/CustomMap';
import { MapPin, Navigation, DollarSign, Clock, Filter } from 'lucide-react';
import './FindParking.css';

const FindParking = () => {
  const navigate = useNavigate();
  const { tAsync, tSync, currentLanguage } = useAutoTranslate();
  const [t, setT] = useState({
    findParkingNearYou: tSync('Find Parking Near You'),
    spotsAvailable: tSync('spots available'),
    filters: tSync('Filters'),
    searchRadius: tSync('Search Radius'),
    maxPrice: tSync('Max Price'),
    sortBy: tSync('Sort By'),
    distance: tSync('Distance'),
    price: tSync('Price'),
    availability: tSync('Availability'),
    vehicleType: tSync('Vehicle Type'),
    any: tSync('Any'),
    noSlotsFound: tSync('No parking slots found in this area'),
    bookNow: tSync('Book Now'),
    navigateBtn: tSync('Navigate'),
    yourLocation: tSync('Your Location'),
    available: tSync('Available'),
    open: tSync('Open'),
    close: tSync('Close'),
    amenities: tSync('Amenities'),
  });

  // Vehicle type presets (same as admin side)
  const VEHICLE_PRESETS = [
    { name: 'Motorcycle', dimensions: { length: 8, width: 4, height: 0 } },
    { name: 'Compact Car', dimensions: { length: 16, width: 8, height: 0 } },
    { name: 'Standard Car', dimensions: { length: 18, width: 9, height: 0 } },
    { name: 'Large Vehicle', dimensions: { length: 20, width: 10, height: 0 } },
    { name: 'Truck/Bus', dimensions: { length: 40, width: 12, height: 0 } },
    { name: 'Custom', dimensions: { length: 0, width: 0, height: 0 } }
  ];

  // State declarations first
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 11.2733, lng: 77.6070 }); // Default: Erode, Tamil Nadu
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [filters, setFilters] = useState({
    searchRadius: 1000,
    maxPrice: 500,
    sortBy: 'distance',
    vehicleType: 'Standard Car',
  });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [showRouteToSlot, setShowRouteToSlot] = useState(null);

  // Functions that use state
  const translateAll = useCallback(async () => {
    const keys = Object.keys(t);
    const translations = {};
    for (const k of keys) {
      translations[k] = await tAsync(t[k]);
    }
    setT(translations);
  }, [t, tAsync]);

  const fetchParkingSlots = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = showUnavailable ? '/all' : '';
      const response = await parkingAPI.getAll(endpoint, {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: filters.searchRadius,
      });
      
      // Transform parking slots to have latitude and longitude properties
      let transformedSlots = response.data.map(slot => ({
        ...slot,
        latitude: slot.latitude || (slot.location?.coordinates?.[1] || 0),
        longitude: slot.longitude || (slot.location?.coordinates?.[0] || 0)
      }));

      // If showing all spots, include both available and unavailable
      // If not showing all spots, only include available ones
      let availableSlots = showUnavailable 
        ? transformedSlots 
        : transformedSlots.filter(slot => slot.availableSlots > 0);

      // Apply strict filters first
      let filteredSlots = availableSlots.filter(slot => {
        // Filter by max price
        if (filters.maxPrice && slot.pricePerHour > filters.maxPrice) {
          return false;
        }
        
        // Filter by vehicle type based on slot dimensions
        if (filters.vehicleType !== 'Custom') {
          const selectedPreset = VEHICLE_PRESETS.find(preset => preset.name === filters.vehicleType);
          if (selectedPreset) {
            // Check if slot can accommodate the selected vehicle type
            const slotLength = slot.slotDimensions?.length || 0;
            const slotWidth = slot.slotDimensions?.width || 0;
            
            if (slotLength < selectedPreset.dimensions.length || 
                slotWidth < selectedPreset.dimensions.width) {
              return false;
            }
          }
        }
        
        return true;
      });

      // If no results with strict filters, apply relaxed filters
      if (filteredSlots.length === 0 && !showUnavailable) {
        console.log('No results with strict filters, applying relaxed filters...');
        
        filteredSlots = availableSlots.filter(slot => {
          // Relax price filter - allow 20% higher than max price
          if (filters.maxPrice && slot.pricePerHour > filters.maxPrice * 1.2) {
            return false;
          }
          
          return true;
        });

        // If still no results, show all available slots
        if (filteredSlots.length === 0) {
          console.log('Still no results, showing all available slots...');
          filteredSlots = availableSlots;
        }
      }

      // Sort the results
      filteredSlots.sort((a, b) => {
        if (filters.sortBy === 'price') {
          return a.pricePerHour - b.pricePerHour;
        } else if (filters.sortBy === 'availability') {
          return b.availableSlots - a.availableSlots;
        } else {
          // Default: sort by distance (calculate approximate distance)
          const distanceA = Math.sqrt(
            Math.pow(a.latitude - userLocation.lat, 2) + 
            Math.pow(a.longitude - userLocation.lng, 2)
          );
          const distanceB = Math.sqrt(
            Math.pow(b.latitude - userLocation.lat, 2) + 
            Math.pow(b.longitude - userLocation.lng, 2)
          );
          return distanceA - distanceB;
        }
      });

      setParkingSlots(filteredSlots);
    } catch (error) {
      console.error('Error fetching parking slots:', error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, filters, showUnavailable]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location. Please make sure location services are enabled.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location if user denies
        }
      );
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookNow = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const navigateToSlot = (slot) => {
    const lat = slot.latitude || (slot.location?.coordinates?.[1] || 0);
    const lng = slot.longitude || (slot.location?.coordinates?.[0] || 0);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleBookingSuccess = (bookedSlot) => {
    // Add to booked slots list
    setBookedSlots(prev => [...prev, bookedSlot]);
    
    // Show route to the booked slot
    setShowRouteToSlot(bookedSlot);
    
    // Close booking modal
    setShowBookingModal(false);
    
    // Navigate to my bookings after a short delay
    setTimeout(() => {
      navigate('/my-bookings');
    }, 2000);
  };

  const getAvailabilityColor = (availableSlots, totalSlots) => {
    const percentage = (availableSlots / totalSlots) * 100;
    if (percentage > 50) return '#10b981';
    if (percentage > 20) return '#f59e0b';
    return '#ef4444';
  };

  // Effects
  useEffect(() => {
    let mounted = true;
    if (currentLanguage !== 'en') {
      translateAll().then((result) => {
        if (mounted) setT(result);
      });
    }
    return () => { mounted = false; };
  }, [currentLanguage, translateAll]);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchParkingSlots();
    }
  }, [userLocation, filters, fetchParkingSlots]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="find-parking">
      <div className="find-parking-container">
        {/* Sidebar */}
        <div className="parking-sidebar">
          <div className="search-header">
            <div className="header-top">
              <h2>
                <MapPin size={24} />
                {t.findParkingNearYou}
              </h2>
              <button 
                className="update-location-btn"
                onClick={handleUpdateLocation}
              >
                <Navigation size={16} />
                Update Location
              </button>
            </div>
            <p>{parkingSlots.length} {showUnavailable ? 'total spots' : t.spotsAvailable}</p>
            
            {/* Toggle for showing unavailable spots */}
            <div className="show-unavailable-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showUnavailable}
                  onChange={(e) => setShowUnavailable(e.target.checked)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">Show unavailable spots</span>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <h3>
              <Filter size={20} />
              {t.filters}
            </h3>
            
            <div className="filter-group">
              <label>{t.searchRadius} (km)</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={filters.searchRadius}
                onChange={(e) => setFilters({ ...filters, searchRadius: Number(e.target.value) })}
                placeholder="e.g., 1000"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>{t.maxPrice} (/hr)</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>{t.sortBy}</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="filter-select"
              >
                <option value="distance">{t.distance}</option>
                <option value="price">{t.price}</option>
                <option value="availability">{t.availability}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t.vehicleType}</label>
              <select
                value={filters.vehicleType}
                onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                className="filter-select"
              >
                {VEHICLE_PRESETS.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parking Slots List */}
          <div className="parking-slots-list">
            {parkingSlots.length > 0 ? (
              parkingSlots.map((slot) => (
                <div 
                  key={slot._id} 
                  className={`parking-slot-card ${selectedSlot?._id === slot._id ? 'selected' : ''} ${slot.availableSlots === 0 ? 'unavailable' : ''}`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="slot-header">
                    <h4>{slot.name}</h4>
                    <span 
                      className={`availability-badge ${slot.availableSlots === 0 ? 'unavailable-badge' : ''}`}
                      style={{ backgroundColor: getAvailabilityColor(slot.availableSlots, slot.totalSlots) }}
                    >
                      {slot.availableSlots === 0 ? 'Unavailable' : `${slot.availableSlots}/${slot.totalSlots} ${t.available}`}
                    </span>
                  </div>
                  
                  <p className="slot-address">{slot.address}</p>
                  
                  <div className="slot-info">
                    <span className="price">
                      <DollarSign size={16} />
                      ₹{slot.pricePerHour}/hr
                    </span>
                    <span>
                      <Clock size={16} />
                      {slot.operatingHours?.open} - {slot.operatingHours?.close}
                    </span>
                  </div>

                  {slot.amenities && slot.amenities.length > 0 && (
                    <div className="amenities">
                      {slot.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToSlot(slot);
                      }}
                    >
                      <Navigation size={16} />
                      {t.navigateBtn}
                    </button>
                    <button
                      className={`btn btn-sm ${slot.availableSlots === 0 ? 'btn-disabled' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (slot.availableSlots > 0) {
                          handleBookNow(slot);
                        }
                      }}
                      disabled={slot.availableSlots === 0}
                    >
                      {slot.availableSlots === 0 ? 'Unavailable' : t.bookNow}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-slots">
                <p>{t.noSlotsFound}</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="parking-map">
          <CustomMap
            parkingSlots={parkingSlots}
            centerLat={userLocation.lat}
            centerLng={userLocation.lng}
            onSlotClick={handleSlotClick}
            userLocation={userLocation}
            bookedSlots={bookedSlots}
            showRouteToSlot={showRouteToSlot}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(bookedSlot) => handleBookingSuccess(bookedSlot)}
        />
      )}
    </div>
  );
};

export default FindParking;
