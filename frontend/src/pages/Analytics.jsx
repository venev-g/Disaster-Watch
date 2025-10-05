import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  Download
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [locations, setLocations] = useState([]);
  const [incidentTrends, setIncidentTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, locationsRes, trendsRes] = await Promise.all([
          axios.get(`${API}/analytics/summary`),
          axios.get(`${API}/analytics/locations`),
          axios.get(`${API}/analytics/trends`).catch(() => ({ data: [] }))
        ]);
        
        setAnalytics(analyticsRes.data);
        setLocations(locationsRes.data);
        setIncidentTrends(trendsRes.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setAnalytics(null);
        setLocations([]);
        setIncidentTrends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Use real location data
  const topLocations = locations.map(loc => ({
    city: loc.location_name,
    incidents: loc.incident_count,
    change: loc.change_percentage || 'N/A'
  }));

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and patterns from emergency incident data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="date-filter-btn">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline" data-testid="export-btn">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="interactive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold" data-testid="total-incidents">
                  {loading ? '...' : (analytics?.total_incidents?.toLocaleString() || '0')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            {analytics?.trend_total && (
              <div className={`flex items-center text-sm mt-2 ${analytics.trend_total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics.trend_total >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {analytics.trend_total >= 0 ? '+' : ''}{analytics.trend_total}% from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="interactive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Urgency</p>
                <p className="text-2xl font-bold" data-testid="avg-urgency">
                  {loading ? '...' : (analytics?.avg_urgency_score?.toFixed(1) || '0.0')}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
            {analytics?.trend_urgency && (
              <div className={`flex items-center text-sm mt-2 ${analytics.trend_urgency <= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                {analytics.trend_urgency <= 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                {analytics.trend_urgency >= 0 ? '+' : ''}{analytics.trend_urgency}% {analytics.trend_urgency <= 0 ? 'improvement' : 'increase'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="interactive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold" data-testid="resolution-rate">
                  {loading ? '...' : (analytics?.resolution_rate?.toFixed(1) + '%' || '0%')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            {analytics?.trend_resolution && (
              <div className={`flex items-center text-sm mt-2 ${analytics.trend_resolution >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics.trend_resolution >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {analytics.trend_resolution >= 0 ? '+' : ''}{analytics.trend_resolution}% this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="interactive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold" data-testid="active-alerts">
                  {loading ? '...' : (analytics?.active_alerts || '0')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            {analytics?.trend_alerts && (
              <div className={`flex items-center text-sm mt-2 ${analytics.trend_alerts >= 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {analytics.trend_alerts >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {analytics.trend_alerts >= 0 ? '+' : ''}{analytics.trend_alerts} since yesterday
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trends Chart */}
        <Card className="interactive" data-testid="trends-chart">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Incident Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {incidentTrends.length > 0 ? (
                <div className="absolute inset-0 flex items-end space-x-4 px-4">
                  {incidentTrends.map((data, index) => {
                    const maxValue = Math.max(...incidentTrends.map(d => d.incidents || 0));
                    return (
                      <div key={data.period || index} className="flex-1 flex flex-col items-center space-y-2">
                        <div className="w-full flex flex-col space-y-1">
                          <div 
                            className="bg-blue-500 rounded-t" 
                            style={{ height: `${maxValue > 0 ? ((data.incidents || 0) / maxValue) * 200 : 0}px` }}
                            title={`${data.incidents || 0} incidents`}
                          ></div>
                          {data.resolved !== undefined && (
                            <div 
                              className="bg-green-500 rounded-t" 
                              style={{ height: `${maxValue > 0 ? ((data.resolved || 0) / maxValue) * 200 : 0}px` }}
                              title={`${data.resolved || 0} resolved`}
                            ></div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{data.period}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  {loading ? 'Loading trend data...' : 'No trend data available'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Affected Locations */}
        <Card className="interactive" data-testid="locations-list">
          <CardHeader>
            <CardTitle>Top Affected Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topLocations.length > 0 ? (
                topLocations.map((location, index) => (
                  <div key={location.city || index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{location.city}</p>
                        <p className="text-sm text-muted-foreground">{location.incidents} incidents</p>
                      </div>
                    </div>
                    {location.change !== 'N/A' && (
                      <Badge variant={location.change.toString().startsWith('+') ? 'default' : 'secondary'}>
                        {location.change}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? 'Loading location data...' : 'No location data available'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
