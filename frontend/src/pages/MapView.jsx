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
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MapView = () => {
  const [mapMode, setMapMode] = useState('satellite');
  const [showFilters, setShowFilters] = useState(false);

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
            {['satellite', 'street', 'terrain'].map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={mapMode === mode ? 'default' : 'ghost'}
                onClick={() => setMapMode(mode)}
                className="text-xs capitalize"
                data-testid={`map-mode-${mode}`}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Full Screen Map */}
        <div className="h-[70vh] bg-gradient-to-br from-green-100 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 relative">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>
          </div>

          {/* Mock Geographic Features */}
          <div className="absolute inset-0">
            {/* Major Roads */}
            <div className="absolute top-1/3 left-0 w-full h-1 bg-gray-600 opacity-50"></div>
            <div className="absolute top-2/3 left-0 w-full h-1 bg-gray-600 opacity-50"></div>
            <div className="absolute left-1/4 top-0 h-full w-1 bg-gray-600 opacity-50"></div>
            <div className="absolute left-3/4 top-0 h-full w-1 bg-gray-600 opacity-50"></div>
            
            {/* Water Bodies */}
            <div className="absolute bottom-10 right-20 w-32 h-20 bg-blue-400 rounded-full opacity-40"></div>
            <div className="absolute top-20 left-32 w-24 h-16 bg-blue-400 rounded-full opacity-40"></div>
            
            {/* Parks */}
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-green-400 rounded-lg opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Incident Clusters */}
          {[
            { id: 1, x: '20%', y: '30%', count: 5, severity: 'critical' },
            { id: 2, x: '60%', y: '50%', count: 3, severity: 'severe' },
            { id: 3, x: '40%', y: '70%', count: 8, severity: 'moderate' },
            { id: 4, x: '80%', y: '25%', count: 2, severity: 'severe' },
            { id: 5, x: '15%', y: '75%', count: 12, severity: 'critical' },
          ].map((cluster) => (
            <div
              key={cluster.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: cluster.x, top: cluster.y }}
              data-testid={`cluster-${cluster.id}`}
            >
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
                ${cluster.severity === 'critical' ? 'bg-red-500' :
                  cluster.severity === 'severe' ? 'bg-orange-500' : 'bg-yellow-500'}
                shadow-lg border-2 border-white animate-pulse
              `}>
                {cluster.count}
              </div>
              <div className={`
                absolute top-1/2 left-1/2 w-16 h-16 rounded-full transform -translate-x-1/2 -translate-y-1/2
                ${cluster.severity === 'critical' ? 'bg-red-500' :
                  cluster.severity === 'severe' ? 'bg-orange-500' : 'bg-yellow-500'}
                opacity-30 animate-ping
              `}></div>
              
              {/* Cluster Tooltip */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                <div className="font-semibold">{cluster.count} incidents</div>
                <div className="capitalize">{cluster.severity} severity</div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-black/90"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Map Footer */}
        <div className="bg-muted/30 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical (17)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Severe (13)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Moderate (28)</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: 2 minutes ago
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