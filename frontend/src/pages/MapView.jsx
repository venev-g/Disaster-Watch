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

  const handleBoundsFilter = (bounds) => {
    setSelectedBounds(bounds);
  };

  const handleClearSelection = () => {
    setSelectedBounds(null);
  };

  const handleSeverityFilter = (severity) => {
    setSeverityFilter(severity === severityFilter ? null : severity);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type === typeFilter ? null : type);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OpenStreetMap - Interactive View</h1>
          <p className="text-muted-foreground">
            Visualize and filter disaster incidents by location
          </p>
          {selectedBounds && (
            <Badge variant="secondary" className="mt-2">
              <MapPin className="h-3 w-3 mr-1" />
              Area filter active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => fetchIncidents(selectedBounds, severityFilter, typeFilter)}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-btn"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <Card className="relative overflow-hidden" data-testid="full-map-container">
        <div className="h-[70vh] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-[1001]">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading map data...</p>
              </div>
            </div>
          )}
          
          <OpenStreetMap
            incidents={incidents}
            onBoundsFilter={handleBoundsFilter}
            selectedBounds={selectedBounds}
            onClearSelection={handleClearSelection}
          />
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
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Low ({incidents.filter(i => i.severity === 'low').length})</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {incidents.length} incidents • {selectedBounds ? 'Filtered by area' : 'All locations'} • Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Filters Sidebar */}
      {showFilters && (
        <Card className="animate-slide-in" data-testid="filters-panel">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Map Filters</span>
              {(severityFilter || typeFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSeverityFilter(null);
                    setTypeFilter(null);
                  }}
                >
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Incident Types</h4>
              <div className="space-y-2">
                {['fire', 'flood', 'earthquake', 'landslide', 'storm', 'other'].map((type) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTypeFilter(type)}
                    className="w-full justify-start capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Severity Levels</h4>
              <div className="space-y-2">
                {[
                  { value: 'critical', color: 'bg-red-500', label: 'Critical' },
                  { value: 'severe', color: 'bg-orange-500', label: 'Severe' },
                  { value: 'moderate', color: 'bg-yellow-500', label: 'Moderate' },
                  { value: 'low', color: 'bg-blue-500', label: 'Low' }
                ].map((severity) => (
                  <Button
                    key={severity.value}
                    variant={severityFilter === severity.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSeverityFilter(severity.value)}
                    className="w-full justify-start"
                  >
                    <div className={`w-3 h-3 ${severity.color} rounded-full mr-2`}></div>
                    {severity.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Location Filter</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Use the "Select Area" button on the map to filter incidents by geographic region
              </p>
              {selectedBounds && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Area Selected
                    </span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                    <div>North: {selectedBounds.north.toFixed(4)}°</div>
                    <div>South: {selectedBounds.south.toFixed(4)}°</div>
                    <div>East: {selectedBounds.east.toFixed(4)}°</div>
                    <div>West: {selectedBounds.west.toFixed(4)}°</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapView;