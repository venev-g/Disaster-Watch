from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import os
import logging
import json
import hashlib
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Import our custom modules
from gemini_agent import GeminiAnalysisAgent
from rss_monitor import RSSMonitor
from models import (
    Incident, IncidentCreate, IncidentResponse,
    Alert, AlertCreate, AlertResponse,
    AnalyticsSummary, LocationSummary
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
GEMINI_API_KEY = os.environ['GEMINI_API_KEY']
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# Initialize MongoDB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Initialize Gemini Agent
gemini_agent = GeminiAnalysisAgent(GEMINI_API_KEY)

# Initialize RSS Monitor
rss_monitor = RSSMonitor(db, gemini_agent)

# Create FastAPI app
app = FastAPI(
    title="DisasterWatch API",
    description="Intelligent Tweet Analyzer for Disaster Management",
    version="1.0.0"
)

# Create API router
api_router = APIRouter(prefix="/api")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for monitoring
monitoring_task = None

@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    global monitoring_task
    logger.info("Starting DisasterWatch API...")
    
    # Start RSS monitoring in background
    monitoring_task = asyncio.create_task(rss_monitor.start_monitoring())
    logger.info("RSS monitoring started")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on app shutdown"""
    global monitoring_task
    if monitoring_task:
        monitoring_task.cancel()
    
    await rss_monitor.stop_monitoring()
    client.close()
    logger.info("DisasterWatch API shutdown complete")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

# Incident endpoints
@api_router.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(
    limit: int = 20,
    offset: int = 0,
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    location: Optional[str] = None
):
    """Get incidents with optional filtering"""
    try:
        # Build query
        query = {}
        if severity:
            query["severity"] = severity
        if incident_type:
            query["incident_type"] = incident_type
        if location:
            query["locations.name"] = {"$regex": location, "$options": "i"}
        
        # Get incidents
        incidents = await db.incidents.find(query)\
            .sort("published_at", -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(length=None)
        
        return [IncidentResponse(**incident) for incident in incidents]
    
    except Exception as e:
        logger.error(f"Error fetching incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch incidents")

@api_router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str):
    """Get specific incident by ID"""
    try:
        incident = await db.incidents.find_one({"id": incident_id})
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return IncidentResponse(**incident)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching incident {incident_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch incident")

@api_router.get("/incidents/map")
async def get_incidents_for_map():
    """Get incidents formatted for map visualization"""
    try:
        incidents = await db.incidents.find({
            "locations": {"$exists": True, "$ne": []}
        }).sort("published_at", -1).limit(100).to_list(length=None)
        
        # Format for GeoJSON
        features = []
        for incident in incidents:
            for location in incident.get("locations", []):
                if location.get("latitude") and location.get("longitude"):
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [location["longitude"], location["latitude"]]
                        },
                        "properties": {
                            "incident_id": incident["id"],
                            "severity": incident.get("severity"),
                            "incident_type": incident.get("incident_type"),
                            "urgency_score": incident.get("urgency_score"),
                            "content": incident.get("content", "")[:100] + "...",
                            "location_name": location.get("name")
                        }
                    })
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
    
    except Exception as e:
        logger.error(f"Error fetching map incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch map data")

# Alert endpoints
@api_router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(limit: int = 20, offset: int = 0):
    """Get alerts"""
    try:
        alerts = await db.alerts.find()\
            .sort("created_at", -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(length=None)
        
        return [AlertResponse(**alert) for alert in alerts]
    
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")

@api_router.post("/alerts", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    background_tasks: BackgroundTasks
):
    """Create new alert"""
    try:
        # Create alert document
        alert_dict = alert_data.dict()
        alert_dict["id"] = f"alert_{int(datetime.now().timestamp())}"
        alert_dict["created_at"] = datetime.now(timezone.utc)
        alert_dict["status"] = "draft"
        
        # Insert into database
        await db.alerts.insert_one(alert_dict)
        
        # If auto_send is True, schedule sending
        if alert_data.auto_send:
            background_tasks.add_task(send_alert, alert_dict["_id"])
        
        return AlertResponse(**alert_dict)
    
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to create alert")

# Analytics endpoints
@api_router.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary():
    """Get analytics summary"""
    try:
        # Calculate date ranges
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Aggregate statistics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_incidents": {"$sum": 1},
                    "critical_incidents": {
                        "$sum": {"$cond": [{"$eq": ["$severity", "critical"]}, 1, 0]}
                    },
                    "avg_urgency": {"$avg": "$urgency_score"},
                    "today_incidents": {
                        "$sum": {
                            "$cond": [
                                {"$gte": ["$published_at", today_start]}, 1, 0
                            ]
                        }
                    }
                }
            }
        ]
        
        result = await db.incidents.aggregate(pipeline).to_list(1)
        stats = result[0] if result else {}
        
        # Count active alerts
        active_alerts = await db.alerts.count_documents({"status": {"$in": ["sent", "sending"]}})
        
        return AnalyticsSummary(
            total_incidents=stats.get("total_incidents", 0),
            critical_incidents=stats.get("critical_incidents", 0),
            active_alerts=active_alerts,
            avg_urgency_score=round(stats.get("avg_urgency", 0), 1),
            incidents_today=stats.get("today_incidents", 0),
            resolution_rate=94.5  # Mock for now
        )
    
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

@api_router.get("/analytics/locations", response_model=List[LocationSummary])
async def get_top_locations(limit: int = 10):
    """Get top affected locations"""
    try:
        pipeline = [
            {"$unwind": "$locations"},
            {
                "$group": {
                    "_id": "$locations.name",
                    "incident_count": {"$sum": 1},
                    "critical_count": {
                        "$sum": {"$cond": [{"$eq": ["$severity", "critical"]}, 1, 0]}
                    },
                    "avg_urgency": {"$avg": "$urgency_score"}
                }
            },
            {"$sort": {"incident_count": -1}},
            {"$limit": limit}
        ]
        
        results = await db.incidents.aggregate(pipeline).to_list(limit)
        
        return [
            LocationSummary(
                location_name=result["_id"],
                incident_count=result["incident_count"],
                critical_count=result["critical_count"],
                avg_urgency_score=round(result["avg_urgency"], 1)
            )
            for result in results
        ]
    
    except Exception as e:
        logger.error(f"Error fetching location analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch location data")

# RSS Monitoring endpoints
@api_router.get("/monitoring/status")
async def get_monitoring_status():
    """Get RSS monitoring status"""
    return {
        "status": "active" if monitoring_task and not monitoring_task.done() else "inactive",
        "feeds_count": len(rss_monitor.rss_feeds),
        "last_check": rss_monitor.last_check_time.isoformat() if rss_monitor.last_check_time else None,
        "total_processed": getattr(rss_monitor, 'total_processed', 0)
    }

@api_router.post("/monitoring/process")
async def manual_process(background_tasks: BackgroundTasks):
    """Manually trigger RSS processing"""
    background_tasks.add_task(rss_monitor.process_all_feeds)
    return {"message": "Processing started"}

# Helper function for sending alerts
async def send_alert(alert_id: str):
    """Background task to send alert"""
    try:
        # Update alert status
        await db.alerts.update_one(
            {"id": alert_id},
            {
                "$set": {
                    "status": "sending",
                    "sent_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Simulate alert sending (replace with real implementation)
        await asyncio.sleep(2)
        
        # Mark as sent
        await db.alerts.update_one(
            {"_id": alert_id},
            {
                "$set": {
                    "status": "sent",
                    "delivery_rate": 95.0,
                    "engagement_rate": 78.0
                }
            }
        )
        
        logger.info(f"Alert {alert_id} sent successfully")
    
    except Exception as e:
        logger.error(f"Failed to send alert {alert_id}: {e}")
        # Mark as failed
        await db.alerts.update_one(
            {"_id": alert_id},
            {"$set": {"status": "failed"}}
        )

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)