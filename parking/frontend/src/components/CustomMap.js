import React, { useEffect, useRef, useState, useCallback } from 'react';
import './CustomMap.css';

const CustomMap = ({ 
  parkingSlots = [], 
  centerLat = 13.0351104, 
  centerLng = 80.232448,
  zoom = 15,
  onSlotClick,
  userLocation = null,
  bookedSlots = [],
  showRouteToSlot = null
}) => {
  const canvasRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({ lat: centerLat, lng: centerLng });
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat, lng, canvasWidth, canvasHeight) => {
    const scale = Math.pow(2, currentZoom) * 100;
    const x = (lng - mapCenter.lng) * scale + canvasWidth / 2;
    const y = (mapCenter.lat - lat) * scale + canvasHeight / 2;
    return { x, y };
  };

  // Draw the map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let i = 0; i <= width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let i = 0; i <= height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw booked slots with special markers
    bookedSlots.forEach(slot => {
      const { x, y } = latLngToCanvas(slot.latitude, slot.longitude, width, height);
      
      // Skip if outside canvas bounds
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;

      // Draw booked slot marker (purple/gold color)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, 14, 0, 2 * Math.PI);
      ctx.fill();

      // Draw star-shaped marker for booked slots
      ctx.fillStyle = '#f59e0b'; // Gold color for booked
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const outerRadius = 14;
        const innerRadius = 7;
        
        const outerX = x + Math.cos(angle) * outerRadius;
        const outerY = y + Math.sin(angle) * outerRadius;
        
        const innerAngle = angle + Math.PI / 5;
        const innerX = x + Math.cos(innerAngle) * innerRadius;
        const innerY = y + Math.sin(innerAngle) * innerRadius;
        
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw "BOOKED" label
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOOKED', x, y - 18);
    });

    // Draw parking slots
    parkingSlots.forEach(slot => {
      const { x, y } = latLngToCanvas(slot.latitude, slot.longitude, width, height);
      
      // Skip if outside canvas bounds
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;

      // Determine marker color based on availability
      const isAvailable = slot.availableSlots > 0;
      const isHovered = hoveredSlot && hoveredSlot._id === slot._id;
      const isSelected = selectedSlot && selectedSlot._id === slot._id;

      // Draw marker shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, isHovered || isSelected ? 14 : 12, 0, 2 * Math.PI);
      ctx.fill();

      // Draw marker
      ctx.fillStyle = isAvailable ? '#10b981' : '#ef4444'; // Green for available, red for unavailable
      ctx.beginPath();
      ctx.arc(x, y, isHovered || isSelected ? 14 : 12, 0, 2 * Math.PI);
      ctx.fill();

      // Draw marker border
      ctx.strokeStyle = isAvailable ? '#059669' : '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, isHovered || isSelected ? 14 : 12, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw availability text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.availableSlots.toString(), x, y);

      // Draw slot name if hovered or selected
      if (isHovered || isSelected) {
        // Draw tooltip background
        const text = slot.name;
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(text).width;
        const tooltipHeight = 20;
        const tooltipX = x - textWidth / 2 - 8;
        const tooltipY = y - 25;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(tooltipX, tooltipY, textWidth + 16, tooltipHeight);

        // Draw tooltip text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, tooltipY + tooltipHeight / 2);
      }
    });

    // Draw route if showRouteToSlot is provided
    if (showRouteToSlot && userLocation) {
      const start = latLngToCanvas(userLocation.lat, userLocation.lng, width, height);
      const end = latLngToCanvas(showRouteToSlot.latitude, showRouteToSlot.longitude, width, height);
      
      // Draw route line
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      
      // Create a simple curved path for better visualization
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 30; // Add curve
      ctx.quadraticCurveTo(midX, midY, end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw route endpoints
      // Start point (user location - already drawn above)
      // End point (destination)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(end.x, end.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(end.x, end.y, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw destination label
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DESTINATION', end.x, end.y - 15);
    }

    // Draw user location if provided
    if (userLocation) {
      const { x, y } = latLngToCanvas(userLocation.lat, userLocation.lng, width, height);
      
      // Draw user location marker (blue dot with pulse effect)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw "You" label
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', x, y - 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingSlots, bookedSlots, showRouteToSlot, mapCenter, currentZoom, hoveredSlot, selectedSlot, userLocation, latLngToCanvas]);

  // Handle canvas click
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on any parking slot
    parkingSlots.forEach(slot => {
      const slotX = latLngToCanvas(slot.latitude, slot.longitude, canvas.width, canvas.height);
      const distance = Math.sqrt(Math.pow(x - slotX.x, 2) + Math.pow(y - slotX.y, 2));
      
      if (distance <= 15) {
        setSelectedSlot(slot);
        if (onSlotClick) {
          onSlotClick(slot);
        }
      }
    });
  };

  // Handle canvas mouse move for hover effects
  const handleCanvasMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if hovering over any parking slot
    let foundSlot = null;
    parkingSlots.forEach(slot => {
      const slotX = latLngToCanvas(slot.latitude, slot.longitude, canvas.width, canvas.height);
      const distance = Math.sqrt(Math.pow(x - slotX.x, 2) + Math.pow(y - slotX.y, 2));
      
      if (distance <= 15) {
        foundSlot = slot;
      }
    });

    if (foundSlot !== hoveredSlot) {
      setHoveredSlot(foundSlot);
      canvas.style.cursor = foundSlot ? 'pointer' : 'default';
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setCurrentZoom(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setCurrentZoom(prev => Math.max(prev - 1, 1));
  };

  // Handle pan
  const handlePan = (direction) => {
    const delta = 0.01 / currentZoom;
    setMapCenter(prev => {
      switch (direction) {
        case 'up': return { ...prev, lat: prev.lat + delta };
        case 'down': return { ...prev, lat: prev.lat - delta };
        case 'left': return { ...prev, lng: prev.lng - delta };
        case 'right': return { ...prev, lng: prev.lng + delta };
        default: return prev;
      }
    });
  };

  // Redraw map when dependencies change
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawMap();
    }
  }, [drawMap]);

  return (
    <div className="custom-map-container">
      <div className="map-controls">
        <button className="zoom-btn" onClick={handleZoomIn}>+</button>
        <button className="zoom-btn" onClick={handleZoomOut}>-</button>
        <div className="pan-controls">
          <button className="pan-btn" onClick={() => handlePan('up')}>↑</button>
          <div className="pan-row">
            <button className="pan-btn" onClick={() => handlePan('left')}>←</button>
            <button className="pan-btn" onClick={() => handlePan('right')}>→</button>
          </div>
          <button className="pan-btn" onClick={() => handlePan('down')}>↓</button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="custom-map-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      />
      
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
          <div className="legend-marker user-location"></div>
          <span>Your Location</span>
        </div>
      </div>

      {selectedSlot && (
        <div className="slot-info-popup">
          <h4>{selectedSlot.name}</h4>
          <p>Address: {selectedSlot.address}</p>
          <p>Available Slots: {selectedSlot.availableSlots}/{selectedSlot.totalSlots}</p>
          <p>Price: ₹{selectedSlot.pricePerHour}/hour</p>
          <button onClick={() => setSelectedSlot(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default CustomMap;
