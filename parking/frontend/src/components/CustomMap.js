import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import './CustomMap.css';

const MapComponent = ({ 
  parkingSlots = [], 
  centerLat = 13.0351104, 
  centerLng = 80.232448,
  zoom = 15,
  onSlotClick,
  userLocation = null,
  bookedSlots = [],
  showRouteToSlot = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapOptions = {
      center: { lat: centerLat, lng: centerLng },
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = newMap;
    setMap(newMap);

    // Initialize directions renderer
    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.7
      }
    });
    renderer.setMap(newMap);
    setDirectionsRenderer(renderer);

    return () => {
      if (mapInstanceRef.current) {
        // Clean up markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [centerLat, centerLng, zoom]);

  // Update map center when user location changes
  useEffect(() => {
    if (map && userLocation) {
      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [map, userLocation]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  }, []);

  // Create marker for parking slot
  const createParkingMarker = useCallback((slot, map) => {
    const isAvailable = slot.availableSlots > 0;
    const isBooked = bookedSlots.some(booked => booked._id === slot._id);
    
    let markerColor;
    if (isBooked) {
      markerColor = 'http://maps.google.com/mapfiles/ms/icons/yellow.png';
    } else if (isAvailable) {
      markerColor = 'http://maps.google.com/mapfiles/ms/icons/green.png';
    } else {
      markerColor = 'http://maps.google.com/mapfiles/ms/icons/red.png';
    }

    const marker = new window.google.maps.Marker({
      position: { 
        lat: slot.latitude || (slot.location?.coordinates?.[1] || 0), 
        lng: slot.longitude || (slot.location?.coordinates?.[0] || 0) 
      },
      map: map,
      title: slot.name,
      icon: {
        url: markerColor,
        scaledSize: new window.google.maps.Size(32, 32)
      },
      animation: window.google.maps.Animation.DROP
    });

    // Create info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${slot.name}</h3>
          <p style="margin: 5px 0; color: #666;">${slot.address}</p>
          <p style="margin: 5px 0;">
            <strong>Available:</strong> ${slot.availableSlots}/${slot.totalSlots}
          </p>
          <p style="margin: 5px 0;">
            <strong>Price:</strong> ₹${slot.pricePerHour}/hour
          </p>
          ${slot.operatingHours ? `
            <p style="margin: 5px 0;">
              <strong>Hours:</strong> ${slot.operatingHours.open} - ${slot.operatingHours.close}
            </p>
          ` : ''}
          ${isBooked ? '<p style="color: #f59e0b; font-weight: bold;">★ BOOKED</p>' : ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
      if (onSlotClick) {
        onSlotClick(slot);
      }
    });

    return { marker, infoWindow };
  }, [bookedSlots, onSlotClick]);

  // Create user location marker
  const createUserLocationMarker = useCallback((map) => {
    if (!userLocation) return null;

    const marker = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#1e40af',
        strokeWeight: 2
      },
      animation: window.google.maps.Animation.BOUNCE
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: '<div style="padding: 5px;"><strong>Your Location</strong></div>'
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Stop bouncing after 2 seconds
    setTimeout(() => {
      marker.setAnimation(null);
    }, 2000);

    return { marker, infoWindow };
  }, [userLocation]);

  // Update markers when parking slots change
  useEffect(() => {
    if (!map) return;

    clearMarkers();

    // Add parking slot markers
    parkingSlots.forEach(slot => {
      const { marker } = createParkingMarker(slot, map);
      markersRef.current.push(marker);
    });

    // Add user location marker
    const userMarker = createUserLocationMarker(map);
    if (userMarker) {
      markersRef.current.push(userMarker.marker);
    }

    // Fit map to show all markers
    if (parkingSlots.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      parkingSlots.forEach(slot => {
        bounds.extend({
          lat: slot.latitude || (slot.location?.coordinates?.[1] || 0),
          lng: slot.longitude || (slot.location?.coordinates?.[0] || 0)
        });
      });

      if (userLocation) {
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      }

      map.fitBounds(bounds);
      
      // Don't zoom in too far
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) {
          map.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, parkingSlots, clearMarkers, createParkingMarker, createUserLocationMarker, userLocation]);

  // Show route to slot
  useEffect(() => {
    if (!map || !directionsRenderer || !showRouteToSlot || !userLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    const request = {
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { 
        lat: showRouteToSlot.latitude || (showRouteToSlot.location?.coordinates?.[1] || 0), 
        lng: showRouteToSlot.longitude || (showRouteToSlot.location?.coordinates?.[0] || 0) 
      },
      travelMode: window.google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      }
    });

    return () => {
      // Clear directions when component unmounts or route changes
      directionsRenderer.setDirections({ routes: [] });
    };
  }, [map, directionsRenderer, showRouteToSlot, userLocation]);

  return (
    <div className="google-map-container">
      <div ref={mapRef} className="google-map-canvas" />
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker available-google"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker unavailable-google"></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker booked-google"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker user-location-google"></div>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
};

const CustomMap = (props) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  console.log('Google Maps API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
  
  if (!apiKey || apiKey === 'your_google_maps_api_key' || apiKey === 'AIzaSyCL3NqHf49FrvtbsrhJX6KjJVUwzMzH29Q') {
    return (
      <div className="map-error-container">
        <div className="map-error">
          <h3>Google Maps API Key Required</h3>
          <p>Please update your .env.development file with a valid Google Maps API key.</p>
          <p>Steps to fix:</p>
          <ol style={{textAlign: 'left', fontSize: '12px'}}>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a></li>
            <li>Create a new project or select existing one</li>
            <li>Enable "Maps JavaScript API" and "Places API"</li>
            <li>Create an API key with no restrictions (for development)</li>
            <li>Update the .env.development file with your new API key</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <Wrapper 
      apiKey={apiKey} 
      libraries={['places', 'geometry']}
      render={(status) => {
        if (status === 'LOADING') return <div className="map-loading">Loading Google Maps...</div>;
        if (status === 'FAILURE') return (
          <div className="map-error-container">
            <div className="map-error">
              <h3>Google Maps Loading Failed</h3>
              <p>Please check your API key configuration and ensure Maps JavaScript API is enabled.</p>
              <p>API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'}</p>
            </div>
          </div>
        );
        if (status === 'SUCCESS') return <MapComponent {...props} />;
      }} 
    />
  );
};

export default CustomMap;
