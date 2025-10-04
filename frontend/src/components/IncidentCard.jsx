import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  Heart, 
  MessageCircle, 
  Share, 
  AlertTriangle,
  Flame,
  Waves,
  Mountain,
  Cloud
} from 'lucide-react';

const IncidentCard = ({ incident, className, style }) => {
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now - publishedDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  const getIncidentIcon = (type) => {
    const iconProps = { className: "h-4 w-4" };
    switch (type) {
      case 'fire': return <Flame {...iconProps} className="h-4 w-4 text-orange-500" />;
      case 'flood': return <Waves {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'earthquake': return <Mountain {...iconProps} className="h-4 w-4 text-amber-500" />;
      case 'landslide': return <Mountain {...iconProps} className="h-4 w-4 text-brown-500" />;
      default: return <AlertTriangle {...iconProps} className="h-4 w-4 text-red-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'severe': return 'default';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className={`interactive overflow-hidden ${className}`} style={style} data-testid="incident-card">
      {/* Header with source and timestamp */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              {getIncidentIcon(incident.incident_type)}
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid="incident-source">{incident.source}</p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span data-testid="incident-time">{formatTimeAgo(incident.published_at)}</span>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span data-testid="incident-location">{incident.locations[0]?.name}</span>
              </div>
            </div>
          </div>
          <Badge variant={getSeverityColor(incident.severity)} data-testid="incident-severity">
            {incident.severity}
          </Badge>
        </div>
      </CardHeader>

      {/* Main content */}
      <CardContent className="space-y-3">
        {/* Incident text */}
        <p className="text-sm leading-relaxed" data-testid="incident-content">
          {incident.content}
        </p>

        {/* Image */}
        {incident.image && (
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={incident.image} 
              alt={`${incident.incident_type} incident`}
              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
              data-testid="incident-image"
            />
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/50 text-white border-0">
                {incident.incident_type.charAt(0).toUpperCase() + incident.incident_type.slice(1)}
              </Badge>
            </div>
          </div>
        )}

        {/* Urgency and distress indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="text-xs text-muted-foreground">Urgency:</div>
            <div className="flex space-x-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < incident.urgency_score 
                      ? incident.urgency_score >= 8 
                        ? 'bg-red-500' 
                        : incident.urgency_score >= 6 
                        ? 'bg-orange-500' 
                        : 'bg-yellow-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium" data-testid="urgency-score">{incident.urgency_score}/10</span>
          </div>
        </div>
      </CardContent>

      {/* Footer with social actions */}
      <CardFooter className="pt-3 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-xs hover:text-red-500 transition-colors"
              data-testid="like-button"
            >
              <Heart className="h-4 w-4" />
              <span>{incident.likes}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-xs hover:text-blue-500 transition-colors"
              data-testid="comment-button"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{incident.comments}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-xs hover:text-green-500 transition-colors"
              data-testid="share-button"
            >
              <Share className="h-4 w-4" />
              <span>{incident.shares}</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Distress: <span className={`font-medium ${
              incident.distress_level === 'high' ? 'text-red-500' :
              incident.distress_level === 'medium' ? 'text-orange-500' :
              'text-yellow-500'
            }`}>{incident.distress_level}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default IncidentCard;