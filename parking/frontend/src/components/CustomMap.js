import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CustomMap.css';

// Define custom icons
const createMarkerIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const availableIcon = createMarkerIcon('green');
const unavailableIcon = createMarkerIcon('red');
const bookedIcon = createMarkerIcon('orange');
const userIcon = createMarkerIcon('blue');

const CustomMap = ({ 
  parkingSlots = [], 
  centerLat = 13.0351104, 
  centerLng = 80.232448,
  zoom = 15,
  onSlotClick,
  userLocation = null,
  bookedSlots = []
}) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current && parkingSlots.length > 0) {
      const map = mapRef.current;
      const bounds = new L.LatLngBounds();
      parkingSlots.forEach(slot => {
        bounds.extend([slot.latitude, slot.longitude]);
      });

      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [parkingSlots, userLocation]);

  const getMarkerIcon = (slot) => {
    if (bookedSlots.some(booked => booked._id === slot._id)) {
      return bookedIcon;
    }
    if (slot.availableSlots > 0) {
      return availableIcon;
    }
    return unavailableIcon;
  };

  return (
    <div className="leaflet-map-container">
      <MapContainer 
        ref={mapRef}
        center={[centerLat, centerLng]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Parking Slot Markers */}
        {parkingSlots.map(slot => (
          <Marker 
            key={slot._id}
            position={[slot.latitude, slot.longitude]}
            icon={getMarkerIcon(slot)}
            eventHandlers={{
              click: () => {
                if (onSlotClick) {
                  onSlotClick(slot);
                }
              },
            }}
          >
            <Popup>
              <div className="map-popup">
                <h4>{slot.name}</h4>
                <p>{slot.address}</p>
                <p><strong>Available:</strong> {slot.availableSlots}/{slot.totalSlots}</p>
                <p><strong>Price:</strong> ₹{slot.pricePerHour}/hour</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker unavailable"></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker user-location"></div>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
};

export default CustomMap;
