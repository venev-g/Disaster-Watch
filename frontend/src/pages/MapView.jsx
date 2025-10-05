import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Layers, 
  MapPin, 
  ZoomIn, 
  ZoomOut,
  Maximize,
  Settings
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MapView = () => {
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [showFilters, setShowFilters] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8282,
    zoom: 4
  });

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get(`${API}/incidents?limit=100`);
        setIncidents(response.data);
      } catch (err) {
        console.error('Error fetching incidents:', err);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'severe': return '#f97316';
      case 'moderate': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const mapStyles = [
    { value: 'mapbox://styles/mapbox/satellite-v9', label: 'Satellite' },
    { value: 'mapbox://styles/mapbox/streets-v11', label: 'Streets' },
    { value: 'mapbox://styles/mapbox/dark-v10', label: 'Dark' }
  ];

  const validIncidents = incidents.filter(incident => 
    incident.locations && 
    incident.locations.length > 0 && 
    incident.locations[0].latitude && 
    incident.locations[0].longitude
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interactive Map</h1>
          <p className="text-muted-foreground">
            Visualize incidents across geographic regions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-btn"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" data-testid="map-settings-btn">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <Card className="relative overflow-hidden" data-testid="full-map-container">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 space-y-1">
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="zoom-in-btn">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="zoom-out-btn">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="w-8 h-8" data-testid="fullscreen-btn">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Mode Toggle */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1 flex space-x-1">
            {mapStyles.map((style) => (
              <Button
                key={style.value}
                size="sm"
                variant={mapStyle === style.value ? 'default' : 'ghost'}
                onClick={() => setMapStyle(style.value)}
                className="text-xs"
                data-testid={`map-mode-${style.label.toLowerCase()}`}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Full Screen Real Map */}
        <div className="h-[70vh] relative">
          {MAPBOX_TOKEN ? (
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
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
                      className="cursor-pointer transform hover:scale-125 transition-transform"
                      onClick={() => setSelectedIncident(incident)}
                      data-testid={`map-marker-${incident.id}`}
                    >
                      {/* Main Marker */}
                      <div 
                        className="w-8 h-8 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative"
                        style={{ backgroundColor: getSeverityColor(incident.severity) }}
                      >
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                        
                        {/* Urgency Ring */}
                        <div 
                          className="absolute inset-0 rounded-full border-2"
                          style={{ 
                            borderColor: getSeverityColor(incident.severity),
                            animation: incident.urgency_score >= 8 ? 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                          }}
                        ></div>
                      </div>
                      
                      {/* Pulse for high urgency */}
                      {incident.urgency_score >= 7 && (
                        <div 
                          className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-30 animate-ping"
                          style={{ backgroundColor: getSeverityColor(incident.severity) }}
                        ></div>
                      )}
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
                  className="max-w-sm"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        selectedIncident.severity === 'critical' ? 'destructive' : 
                        selectedIncident.severity === 'severe' ? 'default' : 'secondary'
                      }>
                        {selectedIncident.severity.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        <span className="capitalize">{selectedIncident.incident_type}</span> • 
                        <span className="ml-1">Urgency: {selectedIncident.urgency_score}/10</span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-base">
                      {selectedIncident.locations[0].name}
                    </h3>
                    
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedIncident.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span className="font-medium">{selectedIncident.source}</span>
                      <span>{new Date(selectedIncident.published_at).toLocaleDateString()}</span>
                    </div>

                    {selectedIncident.sentiment && (
                      <div className="text-xs">
                        <span className="text-gray-500">Distress Level: </span>
                        <span className={`font-medium ${
                          selectedIncident.sentiment.distress_level === 'critical' ? 'text-red-600' :
                          selectedIncident.sentiment.distress_level === 'high' ? 'text-orange-600' :
                          selectedIncident.sentiment.distress_level === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {selectedIncident.sentiment.distress_level}
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Map Unavailable</h3>
                <p className="text-sm">Mapbox access token required</p>
                <p className="text-xs mt-1">Please configure REACT_APP_MAPBOX_TOKEN</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Footer */}
        <div className="bg-muted/30 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical ({incidents.filter(i => i.severity === 'critical').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Severe ({incidents.filter(i => i.severity === 'severe').length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Moderate ({incidents.filter(i => i.severity === 'moderate').length})</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {validIncidents.length} incidents mapped • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters Sidebar */}
      {showFilters && (
        <Card className="animate-slide-in" data-testid="filters-panel">
          <CardHeader>
            <CardTitle>Map Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Incident Types</h4>
              <div className="space-y-2">
                {['Fire', 'Flood', 'Earthquake', 'Landslide'].map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Severity Levels</h4>
              <div className="space-y-2">
                {['Critical', 'Severe', 'Moderate', 'Low'].map((severity) => (
                  <label key={severity} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">{severity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Time Range</h4>
              <select className="w-full p-2 border rounded text-sm">
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Custom range</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapView;