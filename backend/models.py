from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class IncidentSeverity(str, Enum):
    CRITICAL = "critical"
    SEVERE = "severe"
    MODERATE = "moderate"
    LOW = "low"

class IncidentType(str, Enum):
    FLOOD = "flood"
    FIRE = "fire"
    EARTHQUAKE = "earthquake"
    LANDSLIDE = "landslide"
    STORM = "storm"
    OTHER = "other"

class AlertStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"

class DistressLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Location models
class Location(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: Optional[float] = None

# Sentiment analysis model
class Sentiment(BaseModel):
    distress_level: DistressLevel
    emotions: List[str] = []
    help_seeking: bool = False

# Incident models
class IncidentCreate(BaseModel):
    content: str
    source: str
    published_at: datetime
    source_url: Optional[str] = None
    image: Optional[str] = None

class Incident(IncidentCreate):
    id: str
    content_id: str
    processed_at: datetime
    
    # AI Analysis Results
    relevance_score: float
    urgency_score: int  # 1-10 scale
    credibility_score: float
    
    locations: List[Location] = []
    sentiment: Optional[Sentiment] = None
    
    incident_type: IncidentType
    severity: IncidentSeverity
    affected_population: Optional[str] = None
    
    # Social media metrics
    likes: int = 0
    shares: int = 0
    comments: int = 0
    
    # Alert info
    alert_generated: bool = False
    alert_id: Optional[str] = None
    
    # Metadata
    processing_time_ms: Optional[int] = None
    gemini_model: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str = Field(alias="_id")
    content: str
    source: str
    published_at: datetime
    processed_at: datetime
    
    relevance_score: float
    urgency_score: int
    credibility_score: float
    
    locations: List[Location]
    sentiment: Optional[Sentiment]
    
    incident_type: str
    severity: str
    affected_population: Optional[str]
    
    likes: int
    shares: int
    comments: int
    
    image: Optional[str]
    alert_generated: bool
    
    class Config:
        allow_population_by_field_name = True

# Alert models
class AlertCreate(BaseModel):
    title: str
    message: str
    severity: IncidentSeverity
    incident_id: Optional[str] = None
    audience: List[str] = ["public"]
    auto_send: bool = False
    scheduled_at: Optional[datetime] = None

class Alert(AlertCreate):
    _id: str = Field(alias="id")
    status: AlertStatus
    created_at: datetime
    sent_at: Optional[datetime] = None
    delivery_rate: Optional[float] = None
    engagement_rate: Optional[float] = None

class AlertResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    message: str
    severity: str
    status: str
    audience: List[str]
    created_at: datetime
    sent_at: Optional[datetime]
    delivery_rate: Optional[float]
    engagement_rate: Optional[float]
    incident_id: Optional[str]
    
    class Config:
        allow_population_by_field_name = True

# Analytics models
class AnalyticsSummary(BaseModel):
    total_incidents: int
    critical_incidents: int
    active_alerts: int
    avg_urgency_score: float
    incidents_today: int
    resolution_rate: float

class LocationSummary(BaseModel):
    location_name: str
    incident_count: int
    critical_count: int
    avg_urgency_score: float

# RSS Source model
class RSSSource(BaseModel):
    name: str
    url: str
    category: str
    active: bool = True
    last_checked: Optional[datetime] = None
    check_interval_minutes: int = 5