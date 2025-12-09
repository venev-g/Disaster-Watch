import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icon creator based on severity
const createCustomIcon = (severity, urgency) => {
  const colors = {
    critical: '#ef4444',
    severe: '#f97316',
    moderate: '#eab308',
    low: '#3b82f6'
  };

  const color = colors[severity] || colors.low;
  const size = urgency >= 8 ? 32 : urgency >= 6 ? 28 : 24;
  const pulseClass = urgency >= 8 ? 'animate-pulse' : '';

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      ${urgency >= 8 ? '<circle cx="18" cy="6" r="3" fill="#dc2626" stroke="white" stroke-width="1"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: `<div class="${pulseClass}">${svgIcon}</div>`,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Component to handle map selection
const MapSelectionTool = ({ onBoundsSelect, selectionMode, selectedBounds, onClearSelection }) => {
  const map = useMap();
  const [tempBounds, setTempBounds] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPoint = useRef(null);

  useEffect(() => {
    if (!selectionMode) {
      setTempBounds(null);
      setIsDrawing(false);
      startPoint.current = null;
      return;
    }

    const handleMouseDown = (e) => {
      if (!selectionMode) return;
      setIsDrawing(true);
      startPoint.current = e.latlng;
      setTempBounds([e.latlng, e.latlng]);
    };

    const handleMouseMove = (e) => {
      if (!isDrawing || !startPoint.current) return;
      setTempBounds([startPoint.current, e.latlng]);
    };

    const handleMouseUp = (e) => {
      if (!isDrawing || !startPoint.current) return;
      
      const bounds = L.latLngBounds(startPoint.current, e.latlng);
      const boundsData = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
      
      onBoundsSelect(boundsData);
      setIsDrawing(false);
      setTempBounds(null);
      startPoint.current = null;
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    // Change cursor when in selection mode
    map.getContainer().style.cursor = selectionMode ? 'crosshair' : '';

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      map.getContainer().style.cursor = '';
    };
  }, [selectionMode, isDrawing, map, onBoundsSelect]);

  return (
    <>
      {tempBounds && (
        <Rectangle
          bounds={tempBounds}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
        />
      )}
      {selectedBounds && !isDrawing && (
        <Rectangle
          bounds={[
            [selectedBounds.south, selectedBounds.west],
            [selectedBounds.north, selectedBounds.east]
          ]}
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
        />
      )}
    </>
  );
};

const OpenStreetMap = ({ incidents, onBoundsFilter, selectedBounds, onClearSelection }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const defaultCenter = [20, 0];
  const defaultZoom = 2;

  // Calculate map center based on incidents
  const mapCenter = useMemo(() => {
    if (!incidents || incidents.length === 0) return defaultCenter;
    
    const validIncidents = incidents.filter(
      inc => inc.locations?.[0]?.latitude && inc.locations?.[0]?.longitude
    );

    if (validIncidents.length === 0) return defaultCenter;

    const avgLat = validIncidents.reduce((sum, inc) => sum + inc.locations[0].latitude, 0) / validIncidents.length;
    const avgLng = validIncidents.reduce((sum, inc) => sum + inc.locations[0].longitude, 0) / validIncidents.length;
    
    return [avgLat, avgLng];
  }, [incidents]);

  const handleBoundsSelect = (bounds) => {
    setSelectionMode(false);
    onBoundsFilter(bounds);
  };

  const handleClearSelection = () => {
    setSelectionMode(false);
    onClearSelection();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'severe': return 'default';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2">
          <Button
            size="sm"
            variant={selectionMode ? 'default' : 'outline'}
            onClick={() => setSelectionMode(!selectionMode)}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {selectionMode ? 'Drawing...' : 'Select Area'}
          </Button>
          
          {selectedBounds && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearSelection}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filter
            </Button>
          )}
        </div>

        {selectionMode && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Click and drag to select area
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Release to filter incidents
            </p>
          </div>
        )}
      </div>

      {/* OpenStreetMap Container */}
      <MapContainer
        center={mapCenter}
        zoom={defaultZoom}
        className="w-full h-full rounded-lg"
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Selection Tool */}
        <MapSelectionTool
          onBoundsSelect={handleBoundsSelect}
          selectionMode={selectionMode}
          selectedBounds={selectedBounds}
          onClearSelection={onClearSelection}
        />

        {/* Incident Markers */}
        {incidents.map((incident) => {
            if (!incident.locations?.[0]?.latitude || !incident.locations?.[0]?.longitude) {
              return null;
            }

            const position = [
              incident.locations[0].latitude,
              incident.locations[0].longitude
            ];

            return (
              <Marker
                key={incident.id}
                position={position}
                icon={createCustomIcon(incident.severity, incident.urgency_score)}
              >
                <Popup maxWidth={300} className="custom-popup">
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getSeverityColor(incident.severity)}>
                        {incident.severity?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Urgency: {incident.urgency_score}/10
                      </span>
                    </div>

                    <h3 className="font-bold text-sm mb-2">
                      {incident.locations[0]?.name || 'Unknown Location'}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                      {incident.content}
                    </p>

                    <div className="space-y-1 text-xs border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium capitalize">{incident.incident_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="font-medium">{incident.source}</span>
                      </div>
                      {incident.published_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Published:</span>
                          <span className="font-medium">
                            {new Date(incident.published_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* No Data State */}
      {incidents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500] bg-white/50 dark:bg-gray-900/50">
          <div className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Incidents to Display</h3>
            <p className="text-sm">Incident markers will appear as they are detected</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenStreetMap;
