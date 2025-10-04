import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const AlertsPage = () => {
  const [selectedTab, setSelectedTab] = useState('active');

  const alerts = [
    {
      id: 1,
      title: 'Critical Flood Warning - Downtown Brooklyn',
      message: 'Severe flooding detected in downtown Brooklyn area. Immediate evacuation recommended for residents in flood zones A and B.',
      severity: 'critical',
      status: 'sent',
      audience: ['Public', 'Emergency Services'],
      sent_at: '2024-12-19T10:30:00Z',
      delivery_rate: 94,
      engagement_rate: 78
    },
    {
      id: 2,
      title: 'Fire Emergency - 5th Avenue',
      message: 'Large apartment fire reported on 5th Avenue. Avoid area between 42nd and 45th streets. Emergency responders on scene.',
      severity: 'severe',
      status: 'sending',
      audience: ['Public', 'Traffic Control'],
      sent_at: '2024-12-19T09:45:00Z',
      delivery_rate: 67,
      engagement_rate: 45
    },
    {
      id: 3,
      title: 'Earthquake Alert - Bay Area',
      message: 'Magnitude 4.2 earthquake detected. Check for structural damage. Aftershocks possible in next 24 hours.',
      severity: 'moderate',
      status: 'draft',
      audience: ['Public'],
      sent_at: null,
      delivery_rate: 0,
      engagement_rate: 0
    },
    {
      id: 4,
      title: 'Weather Advisory - Storm Warning',
      message: 'Severe thunderstorm approaching. Heavy rain and strong winds expected. Secure outdoor items.',
      severity: 'moderate',
      status: 'scheduled',
      audience: ['Public', 'Transportation'],
      sent_at: '2024-12-19T15:00:00Z',
      delivery_rate: 0,
      engagement_rate: 0
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'severe': return 'default';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-500';
      case 'sending': return 'text-blue-500';
      case 'draft': return 'text-gray-500';
      case 'scheduled': return 'text-orange-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle className=\"h-4 w-4\" />;
      case 'sending': return <Send className=\"h-4 w-4\" />;
      case 'draft': return <AlertCircle className=\"h-4 w-4\" />;
      case 'scheduled': return <Clock className=\"h-4 w-4\" />;
      case 'failed': return <XCircle className=\"h-4 w-4\" />;
      default: return <Bell className=\"h-4 w-4\" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Not sent';
    const now = new Date();
    const sentDate = new Date(dateString);
    const diffInHours = Math.floor((now - sentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just sent';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  const tabs = [
    { id: 'active', label: 'Active Alerts', count: 2 },
    { id: 'sent', label: 'Sent', count: 156 },
    { id: 'draft', label: 'Drafts', count: 3 },
    { id: 'scheduled', label: 'Scheduled', count: 1 }
  ];

  return (
    <div className=\"container mx-auto px-4 py-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold tracking-tight\">Alert Management</h1>
          <p className=\"text-muted-foreground\">
            Create, manage and track emergency alert communications
          </p>
        </div>
        <Button data-testid=\"create-alert-btn\">
          <Plus className=\"h-4 w-4 mr-2\" />
          Create Alert
        </Button>
      </div>

      {/* Stats Overview */}
      <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
        <Card className=\"interactive\">
          <CardContent className=\"p-4 text-center\">
            <div className=\"text-2xl font-bold text-green-500\" data-testid=\"alerts-sent-today\">28</div>
            <div className=\"text-sm text-muted-foreground\">Alerts Sent Today</div>
          </CardContent>
        </Card>
        <Card className=\"interactive\">
          <CardContent className=\"p-4 text-center\">
            <div className=\"text-2xl font-bold text-blue-500\" data-testid=\"avg-delivery-rate\">91%</div>
            <div className=\"text-sm text-muted-foreground\">Avg Delivery Rate</div>
          </CardContent>
        </Card>
        <Card className=\"interactive\">
          <CardContent className=\"p-4 text-center\">
            <div className=\"text-2xl font-bold text-orange-500\" data-testid=\"people-reached\">24.5K</div>
            <div className=\"text-sm text-muted-foreground\">People Reached</div>
          </CardContent>
        </Card>
        <Card className=\"interactive\">
          <CardContent className=\"p-4 text-center\">
            <div className=\"text-2xl font-bold text-purple-500\" data-testid=\"avg-response-time\">2.3min</div>
            <div className=\"text-sm text-muted-foreground\">Avg Response Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className=\"flex items-center space-x-4\">
        <div className=\"relative flex-1\">
          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
          <Input
            type=\"search\"
            placeholder=\"Search alerts...\"
            className=\"pl-10\"
            data-testid=\"search-alerts\"
          />
        </div>
        <Button variant=\"outline\" data-testid=\"filter-alerts\">
          <Filter className=\"h-4 w-4 mr-2\" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <div className=\"border-b\">
        <div className=\"flex space-x-8\">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`
                pb-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              <Badge variant=\"secondary\" className=\"ml-2 text-xs\">
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className=\"space-y-4\">
        {alerts.map((alert) => (
          <Card key={alert.id} className=\"interactive\" data-testid={`alert-${alert.id}`}>
            <CardHeader>
              <div className=\"flex items-start justify-between\">
                <div className=\"space-y-2 flex-1\">
                  <div className=\"flex items-center space-x-2\">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div className={`flex items-center space-x-1 ${getStatusColor(alert.status)}`}>
                      {getStatusIcon(alert.status)}
                      <span className=\"text-sm font-medium capitalize\">{alert.status}</span>
                    </div>
                  </div>
                  <CardTitle className=\"text-lg\" data-testid={`alert-title-${alert.id}`}>
                    {alert.title}
                  </CardTitle>
                </div>
                <div className=\"text-right text-sm text-muted-foreground\">
                  {formatTimeAgo(alert.sent_at)}
                </div>
              </div>
            </CardHeader>

            <CardContent className=\"space-y-4\">
              <p className=\"text-muted-foreground\" data-testid={`alert-message-${alert.id}`}>
                {alert.message}
              </p>

              <div className=\"flex items-center justify-between\">
                <div className=\"flex items-center space-x-4 text-sm\">
                  <div className=\"flex items-center space-x-1\">
                    <Users className=\"h-4 w-4 text-muted-foreground\" />
                    <span>Audience:</span>
                    <div className=\"flex space-x-1\">
                      {alert.audience.map((aud) => (
                        <Badge key={aud} variant=\"outline\" className=\"text-xs\">
                          {aud}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {alert.status === 'sent' && (
                  <div className=\"flex items-center space-x-4 text-sm text-muted-foreground\">
                    <span>Delivery: {alert.delivery_rate}%</span>
                    <span>Engagement: {alert.engagement_rate}%</span>
                  </div>
                )}
              </div>

              {alert.status === 'sent' && (
                <div className=\"grid grid-cols-2 gap-4 pt-2\">
                  <div>
                    <div className=\"text-xs text-muted-foreground mb-1\">Delivery Rate</div>
                    <div className=\"w-full bg-muted rounded-full h-2\">
                      <div 
                        className=\"bg-green-500 h-2 rounded-full\" 
                        style={{ width: `${alert.delivery_rate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className=\"text-xs text-muted-foreground mb-1\">Engagement Rate</div>
                    <div className=\"w-full bg-muted rounded-full h-2\">
                      <div 
                        className=\"bg-blue-500 h-2 rounded-full\" 
                        style={{ width: `${alert.engagement_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className=\"flex items-center justify-between pt-2 border-t\">
                <div className=\"flex space-x-2\">
                  {alert.status === 'draft' && (
                    <>
                      <Button size=\"sm\" data-testid={`edit-alert-${alert.id}`}>Edit</Button>
                      <Button size=\"sm\" variant=\"outline\" data-testid={`send-alert-${alert.id}`}>Send Now</Button>
                    </>
                  )}
                  {alert.status === 'sent' && (
                    <Button size=\"sm\" variant=\"outline\" data-testid={`view-details-${alert.id}`}>
                      View Details
                    </Button>
                  )}
                  {alert.status === 'scheduled' && (
                    <Button size=\"sm\" variant=\"outline\" data-testid={`reschedule-${alert.id}`}>
                      Reschedule
                    </Button>
                  )}
                </div>
                <Button size=\"sm\" variant=\"ghost\" data-testid={`more-options-${alert.id}`}>
                  More Options
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;