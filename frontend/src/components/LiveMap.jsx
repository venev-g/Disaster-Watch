import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const LiveMap = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v11');

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'severe': return '#f97316';
      case 'moderate': return '#eab308';
      default: return '#3b82f6';
    }
  };

  // Filter incidents with valid locations
  const validIncidents = incidents.filter(incident => 
    incident.locations && 
    incident.locations.length > 0 && 
    incident.locations[0].latitude && 
    incident.locations[0].longitude
  );

  // Calculate map bounds if incidents exist
  let initialViewState = {
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 10
  };

  if (validIncidents.length > 0) {
    const lats = validIncidents.map(i => i.locations[0].latitude);
    const lngs = validIncidents.map(i => i.locations[0].longitude);
    
    initialViewState = {
      longitude: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      latitude: lats.reduce((a, b) => a + b, 0) / lats.length,
      zoom: validIncidents.length === 1 ? 12 : 8
    };
  }

  return (
    <Card className="interactive" data-testid="live-map-container">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Live Incident Map</span>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="text-xs px-2 py-1 rounded border"
            >
              <option value="mapbox://styles/mapbox/streets-v11">Streets</option>
              <option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
              <option value="mapbox://styles/mapbox/dark-v10">Dark</option>
            </select>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Layers className="h-3 w-3" />
              <span>Live</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Real Mapbox Map */}
        <div className="h-80 relative">
          {MAPBOX_TOKEN ? (
            <Map
              {...initialViewState}
              style={{ width: '100%', height: '100%' }}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              interactiveLayerIds={['incident-markers']}
            >
              {/* Incident Markers */}
              {validIncidents.map((incident) => {
                const location = incident.locations[0];
                return (
                  <Marker
                    key={incident.id}
                    longitude={location.longitude}
                    latitude={location.latitude}
                    anchor="bottom"
                  >
                    <div
                      className="cursor-pointer transform hover:scale-110 transition-transform"
                      onClick={() => setSelectedIncident(incident)}
                      data-testid={`map-marker-${incident.id}`}
                    >
                      {/* Main Marker */}
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"
                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Pulse Animation */}
                      <div 
                        className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-30 animate-ping"
                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                      ></div>
                    </div>
                  </Marker>
                );
              })}

              {/* Incident Popup */}
              {selectedIncident && (
                <Popup
                  longitude={selectedIncident.locations[0].longitude}
                  latitude={selectedIncident.locations[0].latitude}
                  anchor="top"
                  onClose={() => setSelectedIncident(null)}
                  closeOnClick={false}
                  className="max-w-xs"
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        selectedIncident.severity === 'critical' ? 'destructive' : 
                        selectedIncident.severity === 'severe' ? 'default' : 'secondary'
                      }>
                        {selectedIncident.severity}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">
                        {selectedIncident.incident_type}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-sm">
                      {selectedIncident.locations[0].name}
                    </h4>
                    
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {selectedIncident.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Urgency: {selectedIncident.urgency_score}/10</span>
                      <span>{selectedIncident.source}</span>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Map unavailable</p>
                <p className="text-xs">Mapbox token required</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Critical ({incidents.filter(i => i.severity === 'critical').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Severe ({incidents.filter(i => i.severity === 'severe').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Moderate ({incidents.filter(i => i.severity === 'moderate').length})</span>
              </div>
            </div>
            <span className="text-muted-foreground">{validIncidents.length} mapped incidents</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMap;