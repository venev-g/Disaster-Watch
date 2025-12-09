import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Layers, 
  MapPin, 
  Settings,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import OpenStreetMap from '@/components/OpenStreetMap';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MapView = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBounds, setSelectedBounds] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const fetchIncidents = async (bounds = null, severity = null, type = null) => {
    try {
      setLoading(true);
      let url;
      
      if (bounds) {
        // Fetch incidents within bounds
        url = `${API}/incidents/by-bounds?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`;
        if (severity) url += `&severity=${severity}`;
        if (type) url += `&incident_type=${type}`;
      } else {
        // Fetch all incidents
        url = `${API}/incidents?limit=200`;
        if (severity) url += `&severity=${severity}`;
        if (type) url += `&incident_type=${type}`;
      }
      
      const response = await axios.get(url);
      setIncidents(response.data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(selectedBounds, severityFilter, typeFilter);
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchIncidents(selectedBounds, severityFilter, typeFilter);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedBounds, severityFilter, typeFilter]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'severe': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const mapStyles = [
    { value: 'satellite', label: 'Satellite' },
    { value: 'streets', label: 'Streets' },
    { value: 'terrain', label: 'Terrain' }
  ];

  const validIncidents = incidents.filter(incident => 
    incident.locations && 
    incident.locations.length > 0 && 
    incident.locations[0].latitude && 
    incident.locations[0].longitude
  );

  // Generate realistic positions based on coordinates
  const generatePosition = (incident) => {
    if (incident.locations && incident.locations[0]) {
      const lat = incident.locations[0].latitude;
      const lng = incident.locations[0].longitude;
      
      // Convert world coordinates to map percentage positions
      const x = Math.min(Math.max(((lng + 180) / 360) * 100, 2), 98);
      const y = Math.min(Math.max(((90 - lat) / 180) * 100, 2), 98);
      
      return { left: `${x}%`, top: `${y}%` };
    }
    return { left: '50%', top: '50%' };
  };

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

        {/* Full Screen Real World Map */}
        <div className="h-[70vh] relative overflow-hidden">
          <div className={`h-full w-full relative transition-colors duration-500 ${
            mapStyle === 'satellite' ? 'bg-gradient-to-br from-green-100 via-blue-50 to-blue-200' :
            mapStyle === 'streets' ? 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200' :
            'bg-gradient-to-br from-amber-50 via-green-50 to-blue-50'
          } dark:from-gray-800 dark:via-gray-700 dark:to-gray-600`}>
            
            {/* World Geographic Features */}
            <div className="absolute inset-0">
              {/* Continental Outlines */}
              <div className="absolute top-[15%] left-[8%] w-[25%] h-[35%] bg-green-300 dark:bg-green-800 opacity-60 rounded-xl transform rotate-12"></div>
              <div className="absolute top-[12%] left-[35%] w-[40%] h-[45%] bg-green-300 dark:bg-green-800 opacity-60 rounded-2xl transform -rotate-2"></div>
              <div className="absolute top-[20%] left-[75%] w-[20%] h-[30%] bg-green-300 dark:bg-green-800 opacity-60 rounded-lg transform rotate-6"></div>
              <div className="absolute top-[55%] left-[12%] w-[30%] h-[25%] bg-green-300 dark:bg-green-800 opacity-60 rounded-xl transform -rotate-3"></div>
              <div className="absolute top-[50%] left-[78%] w-[18%] h-[40%] bg-green-300 dark:bg-green-800 opacity-60 rounded-2xl transform rotate-12"></div>
              
              {/* Ocean Bodies */}
              <div className="absolute top-[25%] left-[30%] w-[8%] h-[15%] bg-blue-400 dark:bg-blue-700 opacity-70 rounded-full"></div>
              <div className="absolute bottom-[15%] right-[25%] w-[12%] h-[8%] bg-blue-400 dark:bg-blue-700 opacity-70 rounded-full"></div>
              
              {/* Grid Lines (Longitude/Latitude) */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="world-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#world-grid)" />
                </svg>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="bg-white/90 dark:bg-black/90 p-4 rounded-lg">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading incidents...</p>
                </div>
              </div>
            )}

            {/* Real Incident Markers */}
            {validIncidents.map((incident) => {
              const position = generatePosition(incident);
              
              return (
                <div
                  key={incident.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-125"
                  style={position}
                  data-testid={`map-marker-${incident.id}`}
                  onClick={() => setSelectedIncident(selectedIncident === incident ? null : incident)}
                >
                  {/* Main Marker */}
                  <div className={`w-6 h-6 ${getSeverityColor(incident.severity)} rounded-full border-2 border-white shadow-xl flex items-center justify-center relative z-10`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    
                    {/* Urgency Indicator */}
                    {incident.urgency_score >= 8 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-white rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Pulse Animation for High Urgency */}
                  {incident.urgency_score >= 7 && (
                    <div className={`absolute top-1/2 left-1/2 w-12 h-12 ${getSeverityColor(incident.severity)} rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-40 animate-ping`}></div>
                  )}
                  
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/95 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none min-w-[200px]">
                    <div className="font-bold text-center">{incident.locations[0]?.name || 'Unknown Location'}</div>
                    <div className="text-center capitalize mt-1">{incident.incident_type} • {incident.severity}</div>
                    <div className="text-center mt-1">Urgency: {incident.urgency_score}/10</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95"></div>
                  </div>
                </div>
              );
            })}

            {/* Selected Incident Details Panel */}
            {selectedIncident && (
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-sm z-30 border animate-slide-in">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={selectedIncident.severity === 'critical' ? 'destructive' : selectedIncident.severity === 'severe' ? 'default' : 'secondary'}>
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                  <button 
                    onClick={() => setSelectedIncident(null)}
                    className="text-gray-500 hover:text-gray-700 text-xl leading-none font-bold"
                  >×</button>
                </div>
                
                <h3 className="font-bold text-base mb-2">
                  {selectedIncident.locations[0]?.name || 'Unknown Location'}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                  {selectedIncident.content}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="capitalize font-medium">{selectedIncident.incident_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Urgency:</span>
                    <span className="font-medium">{selectedIncident.urgency_score}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Source:</span>
                    <span className="font-medium">{selectedIncident.source}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-gray-500">Published:</span>
                    <span className="font-medium">{new Date(selectedIncident.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* No Incidents State */}
            {!loading && incidents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Incidents Detected</h3>
                  <p className="text-sm">Real-time incident data will appear here</p>
                  <p className="text-xs mt-1">System monitoring active RSS feeds</p>
                </div>
              </div>
            )}
          </div>
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