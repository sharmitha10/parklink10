import React from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return <div>Loading...</div>;
    case Status.FAILURE:
      return <div>Error loading maps</div>;
    case Status.SUCCESS:
      return <MapComponent />;
  }
};

const MapComponent = () => {
  const mapRef = React.useRef(null);
  
  React.useEffect(() => {
    if (mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
        zoom: 13,
      });
      
      // Add a marker
      new window.google.maps.Marker({
        position: { lat: 37.7749, lng: -122.4194 },
        map: map,
        title: 'Parking Location',
      });
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

const GoogleMap = () => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Google Maps API Key Required</h3>
        <p>Please update your .env.development file with a valid Google Maps API key.</p>
        <p>Current key: {apiKey}</p>
      </div>
    );
  }

  return (
    <Wrapper apiKey={apiKey} render={render}>
      <MapComponent />
    </Wrapper>
  );
};

export default GoogleMap;
