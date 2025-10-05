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
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch incidents and analytics in parallel
        const [incidentsRes, analyticsRes] = await Promise.all([
          axios.get(`${API}/incidents?limit=10`),
          axios.get(`${API}/analytics/summary`)
        ]);

        setIncidents(incidentsRes.data);
        setAnalytics(analyticsRes.data);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        
        // Fallback to mock data if backend fails
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
          }
        ];
        setIncidents(mockIncidents);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate stats from real analytics data or fallback to mock
  const stats = [
    {
      title: 'Active Alerts',
      value: analytics?.active_alerts?.toString() || '0',
      change: '+12%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Critical Incidents',
      value: analytics?.critical_incidents?.toString() || '0',
      change: '+3',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-orange-500'
    },
    {
      title: 'Total Incidents',
      value: analytics?.total_incidents?.toString() || '0',
      change: '+23%',
      trend: 'up',
      icon: Clock,
      color: 'text-green-500'
    },
    {
      title: 'Avg Urgency',
      value: analytics?.avg_urgency_score?.toString() || '0',
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emergency Response Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of emergency incidents and disaster management
            </p>
          </div>
          {error && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Using offline data</span>
            </div>
          )}
        </div>
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