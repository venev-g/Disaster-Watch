import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Download,
  Filter
} from 'lucide-react';

const Analytics = () => {
  // Mock chart data
  const incidentTrends = [
    { month: 'Jan', incidents: 45, resolved: 42 },
    { month: 'Feb', incidents: 52, resolved: 48 },
    { month: 'Mar', incidents: 38, resolved: 35 },
    { month: 'Apr', incidents: 67, resolved: 61 },
    { month: 'May', incidents: 71, resolved: 68 },
    { month: 'Jun', incidents: 58, resolved: 55 },
  ];

  const topLocations = [
    { city: 'New York', incidents: 142, change: '+12%' },
    { city: 'Los Angeles', incidents: 98, change: '+8%' },
    { city: 'Chicago', incidents: 76, change: '-3%' },
    { city: 'Miami', incidents: 64, change: '+15%' },
    { city: 'San Francisco', incidents: 51, change: '+5%' },
  ];

  const incidentTypes = [
    { type: 'Floods', count: 156, percentage: 35, color: 'bg-blue-500' },
    { type: 'Fires', count: 89, percentage: 20, color: 'bg-red-500' },
    { type: 'Earthquakes', count: 67, percentage: 15, color: 'bg-orange-500' },
    { type: 'Storms', count: 78, percentage: 18, color: 'bg-purple-500' },
    { type: 'Other', count: 54, percentage: 12, color: 'bg-gray-500' },
  ];

  return (
    <div className=\"container mx-auto px-4 py-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold tracking-tight\">Analytics Dashboard</h1>
          <p className=\"text-muted-foreground\">
            Insights and patterns from emergency incident data
          </p>
        </div>
        <div className=\"flex items-center space-x-2\">
          <Button variant=\"outline\" data-testid=\"date-filter-btn\">
            <Calendar className=\"h-4 w-4 mr-2\" />
            Last 30 days
          </Button>
          <Button variant=\"outline\" data-testid=\"export-btn\">
            <Download className=\"h-4 w-4 mr-2\" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
        <Card className=\"interactive\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-muted-foreground\">Total Incidents</p>
                <p className=\"text-2xl font-bold\" data-testid=\"total-incidents\">1,247</p>
              </div>
              <TrendingUp className=\"h-8 w-8 text-green-500\" />
            </div>
            <div className=\"flex items-center text-sm text-green-500 mt-2\">
              <TrendingUp className=\"h-3 w-3 mr-1\" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className=\"interactive\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-muted-foreground\">Response Time</p>
                <p className=\"text-2xl font-bold\" data-testid=\"avg-response-time\">4.2min</p>
              </div>
              <TrendingDown className=\"h-8 w-8 text-green-500\" />
            </div>
            <div className=\"flex items-center text-sm text-green-500 mt-2\">
              <TrendingDown className=\"h-3 w-3 mr-1\" />
              -15% improvement
            </div>
          </CardContent>
        </Card>

        <Card className=\"interactive\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-muted-foreground\">Resolution Rate</p>
                <p className=\"text-2xl font-bold\" data-testid=\"resolution-rate\">94.5%</p>
              </div>
              <TrendingUp className=\"h-8 w-8 text-green-500\" />
            </div>
            <div className=\"flex items-center text-sm text-green-500 mt-2\">
              <TrendingUp className=\"h-3 w-3 mr-1\" />
              +2.1% this month
            </div>
          </CardContent>
        </Card>

        <Card className=\"interactive\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-muted-foreground\">Active Alerts</p>
                <p className=\"text-2xl font-bold\" data-testid=\"active-alerts\">28</p>
              </div>
              <TrendingUp className=\"h-8 w-8 text-orange-500\" />
            </div>
            <div className=\"flex items-center text-sm text-orange-500 mt-2\">
              <TrendingUp className=\"h-3 w-3 mr-1\" />
              +12 since yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Incident Trends Chart */}
        <Card className=\"interactive\" data-testid=\"trends-chart\">
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <BarChart3 className=\"h-5 w-5\" />
              <span>Incident Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"h-64 relative\">
              {/* Mock Line Chart */}
              <div className=\"absolute inset-0 flex items-end space-x-4 px-4\">
                {incidentTrends.map((data, index) => (
                  <div key={data.month} className=\"flex-1 flex flex-col items-center space-y-2\">
                    <div className=\"w-full flex flex-col space-y-1\">
                      <div 
                        className=\"bg-blue-500 rounded-t\" 
                        style={{ height: `${(data.incidents / 80) * 200}px` }}
                      ></div>
                      <div 
                        className=\"bg-green-500 rounded-t\" 
                        style={{ height: `${(data.resolved / 80) * 200}px` }}
                      ></div>
                    </div>
                    <span className=\"text-xs text-muted-foreground\">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className=\"absolute top-2 right-2 flex space-x-4 text-xs\">
                <div className=\"flex items-center space-x-1\">
                  <div className=\"w-2 h-2 bg-blue-500 rounded\"></div>
                  <span>Incidents</span>
                </div>
                <div className=\"flex items-center space-x-1\">
                  <div className=\"w-2 h-2 bg-green-500 rounded\"></div>
                  <span>Resolved</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident Types Pie Chart */}
        <Card className=\"interactive\" data-testid=\"types-chart\">
          <CardHeader>
            <CardTitle className=\"flex items-center space-x-2\">
              <PieChart className=\"h-5 w-5\" />
              <span>Incident Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {incidentTypes.map((item, index) => (
                <div key={item.type} className=\"flex items-center space-x-3\">
                  <div className={`w-3 h-3 ${item.color} rounded`}></div>
                  <div className=\"flex-1 flex items-center justify-between\">
                    <span className=\"text-sm font-medium\">{item.type}</span>
                    <span className=\"text-sm text-muted-foreground\">{item.count}</span>
                  </div>
                  <div className=\"w-16 text-right\">
                    <span className=\"text-xs font-medium\">{item.percentage}%</span>
                  </div>
                  <div className=\"w-20 bg-muted rounded-full h-2\">
                    <div 
                      className={`h-2 ${item.color} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Top Affected Locations */}
        <Card className=\"interactive\" data-testid=\"locations-list\">
          <CardHeader>
            <CardTitle>Top Affected Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {topLocations.map((location, index) => (
                <div key={location.city} className=\"flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors\">
                  <div className=\"flex items-center space-x-3\">
                    <div className=\"w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary\">
                      {index + 1}
                    </div>
                    <div>
                      <p className=\"font-medium\">{location.city}</p>
                      <p className=\"text-sm text-muted-foreground\">{location.incidents} incidents</p>
                    </div>
                  </div>
                  <Badge variant={location.change.startsWith('+') ? 'default' : 'secondary'}>
                    {location.change}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className=\"interactive\" data-testid=\"performance-metrics\">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className=\"space-y-6\">
            <div>
              <div className=\"flex justify-between text-sm mb-2\">
                <span>Alert Accuracy</span>
                <span>87%</span>
              </div>
              <div className=\"w-full bg-muted rounded-full h-2\">
                <div className=\"bg-green-500 h-2 rounded-full\" style={{ width: '87%' }}></div>
              </div>
            </div>

            <div>
              <div className=\"flex justify-between text-sm mb-2\">
                <span>Public Engagement</span>
                <span>73%</span>
              </div>
              <div className=\"w-full bg-muted rounded-full h-2\">
                <div className=\"bg-blue-500 h-2 rounded-full\" style={{ width: '73%' }}></div>
              </div>
            </div>

            <div>
              <div className=\"flex justify-between text-sm mb-2\">
                <span>False Positive Rate</span>
                <span>8%</span>
              </div>
              <div className=\"w-full bg-muted rounded-full h-2\">
                <div className=\"bg-orange-500 h-2 rounded-full\" style={{ width: '8%' }}></div>
              </div>
            </div>

            <div>
              <div className=\"flex justify-between text-sm mb-2\">
                <span>System Uptime</span>
                <span>99.8%</span>
              </div>
              <div className=\"w-full bg-muted rounded-full h-2\">
                <div className=\"bg-green-500 h-2 rounded-full\" style={{ width: '99.8%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;