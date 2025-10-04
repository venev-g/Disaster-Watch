import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share
} from 'lucide-react';
import IncidentCard from '../components/IncidentCard';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockIncidents = [
      {
        id: '1',
        content: 'Major flooding reported in downtown Brooklyn. Water levels rising rapidly, several streets impassable. Emergency crews dispatched to assist evacuations.',
        published_at: '2024-12-19T10:30:00Z',
        urgency_score: 9,
        severity: 'critical',
        incident_type: 'flood',
        locations: [{
          name: 'Downtown Brooklyn',
          latitude: 40.6892,
          longitude: -73.9442
        }],
        distress_level: 'high',
        source: 'NYC Emergency Management',
        image: 'https://images.unsplash.com/photo-1600336153113-d66c79de3e91',
        likes: 12,
        shares: 8,
        comments: 5
      },
      {
        id: '2',
        content: 'Apartment building fire on 5th Avenue. Firefighters on scene, residents evacuated safely. Traffic diverted in surrounding blocks.',
        published_at: '2024-12-19T09:15:00Z',
        urgency_score: 8,
        severity: 'severe',
        incident_type: 'fire',
        locations: [{
          name: '5th Avenue Manhattan',
          latitude: 40.7589,
          longitude: -73.9851
        }],
        distress_level: 'high',
        source: 'FDNY Updates',
        image: 'https://images.unsplash.com/photo-1639369488374-561b5486177d',
        likes: 28,
        shares: 15,
        comments: 12
      },
      {
        id: '3',
        content: 'Earthquake tremors felt across the Bay Area. Magnitude 4.2. No immediate damage reports. Residents advised to check for structural damage.',
        published_at: '2024-12-19T08:45:00Z',
        urgency_score: 6,
        severity: 'moderate',
        incident_type: 'earthquake',
        locations: [{
          name: 'Bay Area, CA',
          latitude: 37.7749,
          longitude: -122.4194
        }],
        distress_level: 'medium',
        source: 'USGS Earthquake Alert',
        image: 'https://images.unsplash.com/photo-1677233860259-ce1a8e0f8498',
        likes: 45,
        shares: 23,
        comments: 18
      },
      {
        id: '4',
        content: 'Emergency responders conducting rescue operations after mudslide in Marin County. Several homes affected, residents relocated to temporary shelters.',
        published_at: '2024-12-19T07:20:00Z',
        urgency_score: 7,
        severity: 'severe',
        incident_type: 'landslide',
        locations: [{
          name: 'Marin County, CA',
          latitude: 38.0834,
          longitude: -122.7633
        }],
        distress_level: 'high',
        source: 'Cal Fire Emergency',
        image: 'https://images.unsplash.com/photo-1608723724234-558f4b72d8f5',
        likes: 67,
        shares: 34,
        comments: 29
      }
    ];

    setTimeout(() => {
      setIncidents(mockIncidents);
      setLoading(false);
    }, 1000);
  }, []);

  const stats = [
    {
      title: 'Active Alerts',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Critical Incidents',
      value: '8',
      change: '+3',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-orange-500'
    },
    {
      title: 'Resolved Today',
      value: '156',
      change: '+23%',
      trend: 'up',
      icon: Clock,
      color: 'text-green-500'
    },
    {
      title: 'People Helped',
      value: '2.1K',
      change: '+18%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emergency Response Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of emergency incidents and disaster management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            className="animate-slide-in"
            style={{'--stagger-delay': `${index * 100}ms`}}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live Incident Feed</h2>
            <Badge variant="outline" className="animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live
            </Badge>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg skeleton"></div>
              ))
            ) : (
              incidents.map((incident, index) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  className="animate-slide-in animate-stagger"
                  style={{'--stagger-delay': `${index * 150}ms`}}
                />
              ))
            )}
          </div>
        </div>

        {/* Map & Quick Stats */}
        <div className="space-y-4">
          <LiveMap incidents={incidents} />
          
          <Card className="interactive">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Recent Locations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incidents.slice(0, 3).map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{incident.locations[0]?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{incident.incident_type}</p>
                  </div>
                  <Badge 
                    variant={incident.severity === 'critical' ? 'destructive' : 
                            incident.severity === 'severe' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {incident.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;