import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const LiveMap = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'severe': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  // Filter incidents with valid locations for positioning
  const validIncidents = incidents.filter(incident => 
    incident.locations && 
    incident.locations.length > 0 && 
    incident.locations[0].latitude && 
    incident.locations[0].longitude
  );

  // Generate realistic positions based on actual coordinates
  const generatePosition = (incident, index) => {
    if (incident.locations && incident.locations[0]) {
      const lat = incident.locations[0].latitude;
      const lng = incident.locations[0].longitude;
      
      // Convert coordinates to percentage position for display
      // This is simplified - in real world would use proper map projection
      const x = Math.min(Math.max(((lng + 180) / 360) * 100, 5), 95);
      const y = Math.min(Math.max(((90 - lat) / 180) * 100, 5), 95);
      
      return { left: `${x}%`, top: `${y}%` };
    }
    
    // Fallback positions if no coordinates
    const positions = [
      { left: '25%', top: '30%' },
      { left: '70%', top: '50%' },
      { left: '40%', top: '70%' },
      { left: '15%', top: '75%' }
    ];
    return positions[index % positions.length];
  };

  return (
    <Card className="interactive" data-testid="live-map-container">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Live Incident Map</span>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Real Data</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Real-world Style Map with Geographic Base */}
        <div className="h-80 relative bg-gradient-to-br from-green-50 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 overflow-hidden">
          
          {/* Geographic Grid */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="geo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#geo-grid)" />
            </svg>
          </div>

          {/* World Map Outline (Simplified) */}
          <div className="absolute inset-0">
            {/* Major Landmasses */}
            <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] bg-green-200 dark:bg-green-800 opacity-40 rounded-lg"></div>
            <div className="absolute top-[15%] left-[45%] w-[35%] h-[50%] bg-green-200 dark:bg-green-800 opacity-40 rounded-xl"></div>
            <div className="absolute top-[45%] left-[15%] w-[25%] h-[30%] bg-green-200 dark:bg-green-800 opacity-40 rounded-lg"></div>
            
            {/* Water Bodies */}
            <div className="absolute top-[30%] left-[40%] w-[8%] h-[20%] bg-blue-300 dark:bg-blue-700 opacity-50 rounded-full"></div>
            <div className="absolute bottom-[10%] right-[20%] w-[15%] h-[10%] bg-blue-300 dark:bg-blue-700 opacity-50 rounded-full"></div>
          </div>

          {/* Real Incident Markers */}
          {validIncidents.map((incident, index) => {
            const position = generatePosition(incident, index);
            
            return (
              <div
                key={incident.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={position}
                data-testid={`map-marker-${incident.id}`}
                onClick={() => setSelectedIncident(selectedIncident === incident ? null : incident)}
              >
                {/* Main Marker */}
                <div className={`w-5 h-5 ${getSeverityColor(incident.severity)} rounded-full border-2 border-white shadow-lg animate-pulse relative z-10`}>
                  <div className="w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                
                {/* Urgency Ring */}
                {incident.urgency_score >= 7 && (
                  <div className={`absolute top-1/2 left-1/2 w-10 h-10 ${getSeverityColor(incident.severity)} rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-30 animate-ping`}></div>
                )}
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <div className="font-semibold">{incident.locations[0]?.name || 'Unknown Location'}</div>
                  <div className="text-xs capitalize">{incident.incident_type} - {incident.severity}</div>
                  <div className="text-xs">Urgency: {incident.urgency_score}/10</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                </div>
              </div>
            );
          })}

          {/* Selected Incident Details */}
          {selectedIncident && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-xs z-30 border">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={selectedIncident.severity === 'critical' ? 'destructive' : selectedIncident.severity === 'severe' ? 'default' : 'secondary'}>
                  {selectedIncident.severity.toUpperCase()}
                </Badge>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-500 hover:text-gray-700 text-lg leading-none"
                >×</button>
              </div>
              
              <h4 className="font-bold text-sm mb-1">
                {selectedIncident.locations[0]?.name || 'Unknown Location'}
              </h4>
              
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                {selectedIncident.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{selectedIncident.incident_type}</span>
                <span>Urgency: {selectedIncident.urgency_score}/10</span>
              </div>
              
              <div className="text-xs text-gray-400 mt-1 border-t pt-1">
                {selectedIncident.source} • {new Date(selectedIncident.published_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* No Data State */}
          {incidents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No incidents to display</p>
                <p className="text-xs">Data will appear as incidents are detected</p>
              </div>
            </div>
          )}
        </div>

        {/* Real Data Legend */}
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
            <span className="text-muted-foreground">
              {validIncidents.length} real incidents • Live data
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMap;