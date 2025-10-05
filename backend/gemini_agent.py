import google.generativeai as genai
import json
import logging
import time
import re
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class GeminiAnalysisAgent:
    """Unified Gemini agent for disaster analysis"""
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.pro_model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Analysis prompt template
        self.analysis_prompt = """
You are an expert disaster management AI assistant. Analyze the following content for emergency response purposes.

CONTENT:
{content}

PUBLISHED: {timestamp}
SOURCE: {source}

Analyze and provide a JSON response with:

1. RELEVANCE: Is this disaster/emergency related? (0.0-1.0 score)
2. LOCATIONS: Extract all mentioned locations with estimated coordinates
3. URGENCY: Rate urgency 1-10 considering:
   - Life-threatening situations (9-10)
   - Major property/infrastructure damage (7-8)
   - General distress (4-6)
   - Informational (1-3)
4. SENTIMENT: Analyze emotional state and distress level
5. VERIFICATION: Assess credibility (0.0-1.0)
6. INCIDENT_TYPE: Categorize (flood, fire, earthquake, etc.)
7. KEY_DETAILS: Extract critical information

Response format (valid JSON only):
{
  "relevance_score": 0.0-1.0,
  "urgency_score": 1-10,
  "credibility_score": 0.0-1.0,
  "locations": [
    {"name": "", "latitude": 0.0, "longitude": 0.0, "confidence": 0.0}
  ],
  "sentiment": {
    "distress_level": "low|medium|high|critical",
    "emotions": ["fear", "panic"],
    "help_seeking": true/false
  },
  "incident_type": "flood|fire|earthquake|landslide|storm|other",
  "severity": "low|moderate|severe|critical",
  "key_details": "Brief summary",
  "affected_population": "estimation",
  "immediate_actions": ["action1", "action2"],
  "reasoning": "Brief explanation"
}
"""
    
    async def analyze_content(self, content: str, source: str, timestamp: str, use_pro: bool = False) -> Dict[str, Any]:
        """Analyze content using Gemini"""
        try:
            start_time = time.time()
            
            # Choose model based on complexity
            model = self.pro_model if use_pro else self.model
            
            # Format prompt
            prompt = self.analysis_prompt.format(
                content=content,
                timestamp=timestamp,
                source=source
            )
            
            # Generate response
            response = model.generate_content(prompt)
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini")
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            response_text = re.sub(r'^```(?:json)?\s*', '', response_text, flags=re.MULTILINE)
            response_text = re.sub(r'\s*```$', '', response_text, flags=re.MULTILINE)
            
            # Remove any leading text before the JSON - find first { and last }
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx == -1 or end_idx == -1:
                logger.error(f"No JSON braces found in response: {response_text[:300]}")
                raise Exception("No valid JSON found in response")
            
            json_text = response_text[start_idx:end_idx + 1].strip()
            
            # Try to parse JSON
            try:
                analysis = json.loads(json_text)
            except json.JSONDecodeError as e:
                # Log the problematic JSON for debugging
                logger.error(f"JSON decode error at position {e.pos}: {e.msg}")
                logger.error(f"Problematic JSON snippet: {json_text[max(0, e.pos-50):e.pos+50]}")
                raise
            
            # Validate and clean analysis
            analysis = self._validate_analysis(analysis)
            
            # Add metadata
            processing_time = int((time.time() - start_time) * 1000)
            analysis.update({
                "processing_time_ms": processing_time,
                "gemini_model": "gemini-1.5-pro" if use_pro else "gemini-1.5-flash",
                "processed_at": datetime.now(timezone.utc)
            })
            
            logger.info(f"Content analysis completed in {processing_time}ms")
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            return self._create_fallback_analysis(content)
            
        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            
            # Retry with Pro model if Flash failed
            if not use_pro:
                logger.info("Retrying with Gemini Pro...")
                return await self.analyze_content(content, source, timestamp, use_pro=True)
            
            return self._create_fallback_analysis(content)
    
    def _validate_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean analysis results"""
        # Ensure required fields exist
        analysis.setdefault("relevance_score", 0.5)
        analysis.setdefault("urgency_score", 5)
        analysis.setdefault("credibility_score", 0.5)
        analysis.setdefault("locations", [])
        analysis.setdefault("sentiment", {
            "distress_level": "medium",
            "emotions": [],
            "help_seeking": False
        })
        analysis.setdefault("incident_type", "other")
        analysis.setdefault("severity", "moderate")
        
        # Validate ranges
        analysis["relevance_score"] = max(0.0, min(1.0, analysis["relevance_score"]))
        analysis["urgency_score"] = max(1, min(10, analysis["urgency_score"]))
        analysis["credibility_score"] = max(0.0, min(1.0, analysis["credibility_score"]))
        
        # Validate locations
        valid_locations = []
        for loc in analysis.get("locations", []):
            if isinstance(loc, dict) and loc.get("name"):
                # Set defaults for coordinates if missing
                loc.setdefault("latitude", None)
                loc.setdefault("longitude", None)
                loc.setdefault("confidence", 0.5)
                valid_locations.append(loc)
        
        analysis["locations"] = valid_locations
        
        return analysis
    
    def _create_fallback_analysis(self, content: str) -> Dict[str, Any]:
        """Create fallback analysis when Gemini fails"""
        # Basic keyword-based analysis
        disaster_keywords = [
            "flood", "fire", "earthquake", "storm", "hurricane", "tornado",
            "landslide", "emergency", "disaster", "evacuation", "rescue"
        ]
        
        urgency_keywords = [
            "urgent", "critical", "emergency", "help", "rescue", "evacuate",
            "danger", "life-threatening", "immediate"
        ]
        
        content_lower = content.lower()
        
        # Calculate basic scores
        relevance = 0.8 if any(keyword in content_lower for keyword in disaster_keywords) else 0.3
        urgency = 8 if any(keyword in content_lower for keyword in urgency_keywords) else 5
        
        # Determine incident type
        incident_type = "other"
        for dtype in ["flood", "fire", "earthquake", "storm"]:
            if dtype in content_lower:
                incident_type = dtype
                break
        
        return {
            "relevance_score": relevance,
            "urgency_score": urgency,
            "credibility_score": 0.6,
            "locations": [],
            "sentiment": {
                "distress_level": "medium",
                "emotions": ["concern"],
                "help_seeking": "help" in content_lower
            },
            "incident_type": incident_type,
            "severity": "moderate",
            "key_details": content[:200] + "..." if len(content) > 200 else content,
            "affected_population": "unknown",
            "immediate_actions": ["monitor situation"],
            "reasoning": "Fallback analysis due to AI processing error",
            "processing_time_ms": 100,
            "gemini_model": "fallback",
            "processed_at": datetime.now(timezone.utc)
        }
    
    async def generate_alert(self, incident_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate alert message for incident"""
        try:
            prompt = f"""
Generate an emergency alert message based on this incident:

Incident Type: {incident_data.get('incident_type')}
Severity: {incident_data.get('severity')}
Location: {incident_data.get('locations', [{}])[0].get('name', 'Unknown')}
Urgency Score: {incident_data.get('urgency_score')}/10
Details: {incident_data.get('key_details')}

Create:
1. A public alert message (concise, actionable)
2. An emergency services message (detailed, technical)

Response format:
{{
  "public_message": "Alert text for general public",
  "emergency_message": "Detailed alert for emergency services"
}}
"""
            
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                json_match = re.search(r'{.*}', response.text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            
            # Fallback alert generation
            return {
                "public_message": f"{incident_data.get('severity', 'Moderate').title()} {incident_data.get('incident_type', 'incident')} reported in {incident_data.get('locations', [{}])[0].get('name', 'affected area')}. Follow local emergency guidelines.",
                "emergency_message": f"Emergency Response: {incident_data.get('severity', 'moderate')} {incident_data.get('incident_type', 'incident')} - Urgency {incident_data.get('urgency_score', 5)}/10. Location: {incident_data.get('locations', [{}])[0].get('name', 'unknown')}. Details: {incident_data.get('key_details', 'See incident report')}"
            }
            
        except Exception as e:
            logger.error(f"Alert generation failed: {e}")
            return {
                "public_message": "Emergency situation reported. Please follow local emergency guidelines.",
                "emergency_message": "Emergency alert generation failed. Manual review required."
            }