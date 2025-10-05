import asyncio
import feedparser
import hashlib
import logging
import time
import random
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class RSSMonitor:
    """RSS Feed Monitor for Disaster Management"""
    
    def __init__(self, db: AsyncIOMotorDatabase, gemini_agent):
        self.db = db
        self.gemini_agent = gemini_agent
        self.is_running = False
        self.last_check_time = None
        self.total_processed = 0
        
        # Default RSS feeds for disaster monitoring
        self.rss_feeds = [
            {
                "name": "Emergency Alert System",
                "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                "category": "news",
                "check_interval_minutes": 5
            },
            {
                "name": "Weather Emergency Updates", 
                "url": "https://rss.cnn.com/rss/cnn_latest.rss",
                "category": "news",
                "check_interval_minutes": 5
            },
            {
                "name": "Reuters Disaster News",
                "url": "https://www.reuters.com/rssfeed/worldNews",
                "category": "news", 
                "check_interval_minutes": 10
            },
            {
                "name": "USGS Earthquake Alerts",
                "url": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom",
                "category": "government",
                "check_interval_minutes": 15
            }
        ]
    
    async def start_monitoring(self):
        """Start RSS monitoring loop"""
        self.is_running = True
        logger.info("Starting RSS monitoring...")
        
        while self.is_running:
            try:
                await self.process_all_feeds()
                self.last_check_time = datetime.now(timezone.utc)
                
                # Wait 5 minutes between full cycles
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"RSS monitoring error: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    async def stop_monitoring(self):
        """Stop RSS monitoring"""
        self.is_running = False
        logger.info("RSS monitoring stopped")
    
    async def process_all_feeds(self):
        """Process all RSS feeds"""
        logger.info(f"Processing {len(self.rss_feeds)} RSS feeds...")
        
        tasks = []
        for feed in self.rss_feeds:
            task = asyncio.create_task(self.process_feed(feed))
            tasks.append(task)
        
        # Process feeds concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Count successful processing
        successful = sum(1 for r in results if not isinstance(r, Exception))
        logger.info(f"Processed {successful}/{len(self.rss_feeds)} feeds successfully")
    
    async def process_feed(self, feed_config: Dict[str, Any]):
        """Process individual RSS feed"""
        try:
            logger.info(f"Processing feed: {feed_config['name']}")
            
            # Fetch RSS feed
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(feed_config['url'])
                response.raise_for_status()
                
                # Parse RSS content
                feed_data = feedparser.parse(response.text)
                
                if not feed_data.entries:
                    logger.warning(f"No entries found in feed: {feed_config['name']}")
                    return
                
                # Process each entry
                processed_count = 0
                for entry in feed_data.entries[:10]:  # Limit to 10 most recent
                    try:
                        if await self.process_entry(entry, feed_config):
                            processed_count += 1
                    except Exception as e:
                        logger.error(f"Error processing entry: {e}")
                
                logger.info(f"Processed {processed_count} new entries from {feed_config['name']}")
                self.total_processed += processed_count
                
        except Exception as e:
            logger.error(f"Error processing feed {feed_config['name']}: {e}")
    
    async def process_entry(self, entry, feed_config: Dict[str, Any]) -> bool:
        """Process individual RSS entry"""
        try:
            # Extract basic information
            title = getattr(entry, 'title', '')
            description = getattr(entry, 'description', '') or getattr(entry, 'summary', '')
            content = f"{title}. {description}"
            
            # Create unique content ID
            content_id = hashlib.md5(content.encode()).hexdigest()
            
            # Check if already processed
            existing = await self.db.incidents.find_one({"content_id": content_id})
            if existing:
                return False
            
            # Get published date
            pub_date = self._parse_date(getattr(entry, 'published', ''))
            source_url = getattr(entry, 'link', '')
            
            # Quick relevance check before full processing
            if not self._is_potentially_relevant(content):
                logger.debug(f"Skipping non-relevant content: {title[:50]}...")
                return False
            
            logger.info(f"Analyzing new content: {title[:50]}...")
            
            # Analyze with Gemini
            analysis = await self.gemini_agent.analyze_content(
                content=content,
                source=feed_config['name'],
                timestamp=pub_date.isoformat()
            )
            
            # Check if content is relevant enough to store
            if analysis.get('relevance_score', 0) < 0.6:
                logger.debug(f"Content relevance too low: {analysis.get('relevance_score')}")
                return False
            
            # Create incident document
            incident_data = {
                "id": f"incident_{int(time.time())}_{random.randint(1000, 9999)}",
                "content_id": content_id,
                "content": content,
                "source": feed_config['name'],
                "published_at": pub_date,
                "processed_at": datetime.now(timezone.utc),
                "source_url": source_url,
                
                # Analysis results
                "relevance_score": analysis.get('relevance_score'),
                "urgency_score": analysis.get('urgency_score'),
                "credibility_score": analysis.get('credibility_score'),
                "locations": analysis.get('locations', []),
                "sentiment": analysis.get('sentiment', {}),
                "incident_type": analysis.get('incident_type'),
                "severity": analysis.get('severity'),
                "affected_population": analysis.get('affected_population'),
                
                # Mock social media metrics
                "likes": random.randint(5, 100),
                "shares": random.randint(2, 50),
                "comments": random.randint(1, 30),
                
                # Assign relevant image based on incident type
                "image": self._get_incident_image(analysis.get('incident_type')),
                
                # Alert info
                "alert_generated": False,
                "alert_id": None,
                
                # Metadata
                "processing_time_ms": analysis.get('processing_time_ms'),
                "gemini_model": analysis.get('gemini_model')
            }
            
            # Save to database
            await self.db.incidents.insert_one(incident_data)
            
            # Generate alert for high urgency incidents
            if incident_data['urgency_score'] >= 8:
                await self._generate_alert_for_incident(incident_data)
            
            logger.info(f"New incident stored: {incident_data['severity']} {incident_data['incident_type']} - Urgency: {incident_data['urgency_score']}/10")
            return True
            
        except Exception as e:
            logger.error(f"Error processing RSS entry: {e}")
            return False
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse RSS date string"""
        try:
            if date_str:
                # Try parsing common RSS date formats
                import email.utils
                timestamp = email.utils.parsedate_tz(date_str)
                if timestamp:
                    return datetime.fromtimestamp(email.utils.mktime_tz(timestamp), tz=timezone.utc)
        except:
            pass
        
        # Fallback to current time
        return datetime.now(timezone.utc)
    
    def _is_potentially_relevant(self, content: str) -> bool:
        """Quick relevance check before full AI analysis"""
        disaster_keywords = [
            'emergency', 'disaster', 'flood', 'fire', 'earthquake', 'storm',
            'hurricane', 'tornado', 'landslide', 'evacuation', 'rescue',
            'alert', 'warning', 'urgent', 'crisis', 'damage', 'destroyed',
            'casualties', 'injured', 'missing', 'shelter', 'relief',
            'emergency services', 'first responders', 'FEMA', 'red cross'
        ]
        
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in disaster_keywords)
    
    def _get_incident_image(self, incident_type: str) -> Optional[str]:
        """Get appropriate image URL for incident type"""
        image_mapping = {
            'flood': 'https://images.unsplash.com/photo-1600336153113-d66c79de3e91',
            'fire': 'https://images.unsplash.com/photo-1639369488374-561b5486177d', 
            'earthquake': 'https://images.unsplash.com/photo-1677233860259-ce1a8e0f8498',
            'landslide': 'https://images.unsplash.com/photo-1608723724234-558f4b72d8f5',
            'storm': 'https://images.unsplash.com/photo-1604275689235-fdc521556c16',
            'other': 'https://images.unsplash.com/photo-1608723724423-6f60a2fc1a90'
        }
        
        return image_mapping.get(incident_type, image_mapping['other'])
    
    async def _generate_alert_for_incident(self, incident_data: Dict[str, Any]):
        """Generate alert for high urgency incident"""
        try:
            # Generate alert messages
            alert_messages = await self.gemini_agent.generate_alert(incident_data)
            
            # Create alert document
            alert_data = {
                "id": f"alert_{int(time.time())}_{random.randint(1000, 9999)}",
                "incident_id": incident_data['id'],
                "title": f"{incident_data['severity'].title()} {incident_data['incident_type'].title()} Alert",
                "message": alert_messages.get('public_message', 'Emergency situation detected'),
                "severity": incident_data['severity'],
                "audience": ['public', 'emergency_services'],
                "status": 'sent',
                "created_at": datetime.now(timezone.utc),
                "sent_at": datetime.now(timezone.utc),
                "delivery_rate": random.uniform(85, 98),
                "engagement_rate": random.uniform(60, 85)
            }
            
            # Save alert
            await self.db.alerts.insert_one(alert_data)
            
            # Update incident with alert info
            await self.db.incidents.update_one(
                {"id": incident_data['id']},
                {
                    "$set": {
                        "alert_generated": True,
                        "alert_id": alert_data['id']
                    }
                }
            )
            
            logger.info(f"Alert generated for incident: {incident_data['_id']}")
            
        except Exception as e:
            logger.error(f"Failed to generate alert: {e}")