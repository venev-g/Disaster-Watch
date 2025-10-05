import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers } from 'lucide-react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const LiveMap = ({ incidents }) => {
  // Mock map component - in real implementation would use Mapbox
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'severe': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="interactive" data-testid="live-map-container">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Live Incident Map</span>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Layers className="h-3 w-3" />
            <span>Satellite</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mock Map Container */}
        <div className="relative h-80 bg-gradient-to-br from-green-100 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 overflow-hidden">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Mock Map Features */}
          <div className="absolute inset-0">
            {/* Mock Roads */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-400 transform -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400 transform -translate-x-1/2"></div>
            
            {/* Mock Water Bodies */}
            <div className="absolute bottom-4 right-8 w-16 h-10 bg-blue-300 rounded-full opacity-60"></div>
            <div className="absolute top-8 left-12 w-12 h-8 bg-blue-300 rounded-full opacity-60"></div>
          </div>

          {/* Incident Markers */}
          {incidents.map((incident, index) => {
            const positions = [
              { top: '20%', left: '25%' },
              { top: '60%', left: '70%' },
              { top: '45%', left: '40%' },
              { top: '75%', left: '15%' }
            ];
            const position = positions[index] || positions[0];
            
            return (
              <div
                key={incident.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ top: position.top, left: position.left }}
                data-testid={`map-marker-${incident.id}`}
              >
                {/* Marker */}
                <div className={`w-4 h-4 ${getSeverityColor(incident.severity)} rounded-full border-2 border-white shadow-lg animate-pulse`}></div>
                
                {/* Pulse Ring */}
                <div className={`absolute top-1/2 left-1/2 w-8 h-8 ${getSeverityColor(incident.severity)} rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-30 animate-ping`}></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="font-semibold">{incident.locations[0]?.name}</div>
                  <div className="text-xs capitalize">{incident.incident_type} - {incident.severity}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Legend */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Severe</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Moderate</span>
              </div>
            </div>
            <span className="text-muted-foreground">{incidents.length} incidents</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMap;