#!/usr/bin/env python3
"""
DisasterWatch Backend API Testing Suite
Tests the OpenStreetMap integration endpoints and existing functionality
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "https://geo-alert-filter.preview.emergentagent.com/api"

class DisasterWatchTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "timestamp" in data and "version" in data:
                    self.log_test("Health Check", True, f"Status: {data['status']}, Version: {data['version']}")
                else:
                    self.log_test("Health Check", False, "Missing required fields in response", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_incidents_endpoint(self):
        """Test basic incidents endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/incidents?limit=10")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Basic Incidents Endpoint", True, f"Retrieved {len(data)} incidents")
                    
                    # Check structure of first incident if available
                    if data:
                        incident = data[0]
                        required_fields = ["id", "content", "severity", "incident_type"]
                        missing_fields = [field for field in required_fields if field not in incident]
                        if missing_fields:
                            self.log_test("Incident Structure", False, f"Missing fields: {missing_fields}", incident)
                        else:
                            self.log_test("Incident Structure", True, "All required fields present")
                else:
                    self.log_test("Basic Incidents Endpoint", False, "Response is not a list", data)
            else:
                self.log_test("Basic Incidents Endpoint", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Basic Incidents Endpoint", False, f"Exception: {str(e)}")

    def test_incidents_map_endpoint(self):
        """Test enhanced /api/incidents/map endpoint"""
        try:
            # Test basic map endpoint
            response = self.session.get(f"{self.base_url}/incidents/map")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check GeoJSON structure
                if data.get("type") == "FeatureCollection" and "features" in data:
                    features = data["features"]
                    self.log_test("Map Endpoint - Basic", True, f"Retrieved GeoJSON with {len(features)} features")
                    
                    # Check feature structure if available
                    if features:
                        feature = features[0]
                        if (feature.get("type") == "Feature" and 
                            "geometry" in feature and 
                            "properties" in feature):
                            
                            # Check geometry
                            geometry = feature["geometry"]
                            if (geometry.get("type") == "Point" and 
                                "coordinates" in geometry and 
                                len(geometry["coordinates"]) == 2):
                                
                                # Check properties
                                props = feature["properties"]
                                required_props = ["incident_id", "severity", "incident_type", "content", "location_name"]
                                missing_props = [prop for prop in required_props if prop not in props]
                                
                                if missing_props:
                                    self.log_test("Map Feature Structure", False, f"Missing properties: {missing_props}", props)
                                else:
                                    self.log_test("Map Feature Structure", True, "All required properties present")
                            else:
                                self.log_test("Map Feature Geometry", False, "Invalid geometry structure", geometry)
                        else:
                            self.log_test("Map Feature Structure", False, "Invalid feature structure", feature)
                else:
                    self.log_test("Map Endpoint - Basic", False, "Invalid GeoJSON structure", data)
            else:
                self.log_test("Map Endpoint - Basic", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Map Endpoint - Basic", False, f"Exception: {str(e)}")

    def test_incidents_map_with_filters(self):
        """Test map endpoint with severity and type filters"""
        try:
            # Test with severity filter
            response = self.session.get(f"{self.base_url}/incidents/map?severity=critical")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    features = data["features"]
                    self.log_test("Map Endpoint - Severity Filter", True, f"Retrieved {len(features)} critical incidents")
                    
                    # Verify all features have critical severity
                    if features:
                        non_critical = [f for f in features if f.get("properties", {}).get("severity") != "critical"]
                        if non_critical:
                            self.log_test("Severity Filter Validation", False, f"Found {len(non_critical)} non-critical incidents")
                        else:
                            self.log_test("Severity Filter Validation", True, "All incidents have critical severity")
                else:
                    self.log_test("Map Endpoint - Severity Filter", False, "Invalid response structure", data)
            else:
                self.log_test("Map Endpoint - Severity Filter", False, f"HTTP {response.status_code}", response.text)

            # Test with incident type filter
            response = self.session.get(f"{self.base_url}/incidents/map?incident_type=fire")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    features = data["features"]
                    self.log_test("Map Endpoint - Type Filter", True, f"Retrieved {len(features)} fire incidents")
                    
                    # Verify all features have fire type
                    if features:
                        non_fire = [f for f in features if f.get("properties", {}).get("incident_type") != "fire"]
                        if non_fire:
                            self.log_test("Type Filter Validation", False, f"Found {len(non_fire)} non-fire incidents")
                        else:
                            self.log_test("Type Filter Validation", True, "All incidents are fire type")
                else:
                    self.log_test("Map Endpoint - Type Filter", False, "Invalid response structure", data)
            else:
                self.log_test("Map Endpoint - Type Filter", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Map Endpoint - Filters", False, f"Exception: {str(e)}")

    def test_incidents_by_bounds_endpoint(self):
        """Test new /api/incidents/by-bounds endpoint"""
        try:
            # Test basic bounds query (New York area)
            params = {
                "north": 45.0,
                "south": 40.0,
                "east": -70.0,
                "west": -75.0
            }
            
            response = self.session.get(f"{self.base_url}/incidents/by-bounds", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check GeoJSON structure
                if data.get("type") == "FeatureCollection" and "features" in data and "bounds" in data:
                    features = data["features"]
                    bounds = data["bounds"]
                    
                    self.log_test("By-Bounds Endpoint - Basic", True, f"Retrieved {len(features)} incidents within bounds")
                    
                    # Verify bounds info
                    expected_bounds = {"north": 45.0, "south": 40.0, "east": -70.0, "west": -75.0}
                    if bounds == expected_bounds:
                        self.log_test("Bounds Info Validation", True, "Bounds info matches request")
                    else:
                        self.log_test("Bounds Info Validation", False, f"Expected {expected_bounds}, got {bounds}")
                    
                    # Verify coordinates are within bounds
                    if features:
                        out_of_bounds = []
                        for feature in features:
                            coords = feature.get("geometry", {}).get("coordinates", [])
                            if len(coords) == 2:
                                lng, lat = coords
                                if not (40.0 <= lat <= 45.0 and -75.0 <= lng <= -70.0):
                                    out_of_bounds.append(coords)
                        
                        if out_of_bounds:
                            self.log_test("Bounds Filtering Validation", False, f"Found {len(out_of_bounds)} incidents outside bounds")
                        else:
                            self.log_test("Bounds Filtering Validation", True, "All incidents within specified bounds")
                else:
                    self.log_test("By-Bounds Endpoint - Basic", False, "Invalid response structure", data)
            else:
                self.log_test("By-Bounds Endpoint - Basic", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("By-Bounds Endpoint - Basic", False, f"Exception: {str(e)}")

    def test_incidents_by_bounds_with_filters(self):
        """Test by-bounds endpoint with additional filters"""
        try:
            # Test with severity filter
            params = {
                "north": 45.0,
                "south": 40.0,
                "east": -70.0,
                "west": -75.0,
                "severity": "critical"
            }
            
            response = self.session.get(f"{self.base_url}/incidents/by-bounds", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    features = data["features"]
                    self.log_test("By-Bounds + Severity Filter", True, f"Retrieved {len(features)} critical incidents in bounds")
                    
                    # Verify all are critical
                    if features:
                        non_critical = [f for f in features if f.get("properties", {}).get("severity") != "critical"]
                        if non_critical:
                            self.log_test("By-Bounds Severity Validation", False, f"Found {len(non_critical)} non-critical incidents")
                        else:
                            self.log_test("By-Bounds Severity Validation", True, "All incidents are critical")
                else:
                    self.log_test("By-Bounds + Severity Filter", False, "Invalid response structure", data)
            else:
                self.log_test("By-Bounds + Severity Filter", False, f"HTTP {response.status_code}", response.text)

            # Test with incident type filter
            params = {
                "north": 45.0,
                "south": 40.0,
                "east": -70.0,
                "west": -75.0,
                "incident_type": "fire"
            }
            
            response = self.session.get(f"{self.base_url}/incidents/by-bounds", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    features = data["features"]
                    self.log_test("By-Bounds + Type Filter", True, f"Retrieved {len(features)} fire incidents in bounds")
                    
                    # Verify all are fire type
                    if features:
                        non_fire = [f for f in features if f.get("properties", {}).get("incident_type") != "fire"]
                        if non_fire:
                            self.log_test("By-Bounds Type Validation", False, f"Found {len(non_fire)} non-fire incidents")
                        else:
                            self.log_test("By-Bounds Type Validation", True, "All incidents are fire type")
                else:
                    self.log_test("By-Bounds + Type Filter", False, "Invalid response structure", data)
            else:
                self.log_test("By-Bounds + Type Filter", False, f"HTTP {response.status_code}", response.text)

            # Test with combined filters
            params = {
                "north": 45.0,
                "south": 40.0,
                "east": -70.0,
                "west": -75.0,
                "severity": "critical",
                "incident_type": "fire"
            }
            
            response = self.session.get(f"{self.base_url}/incidents/by-bounds", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    features = data["features"]
                    self.log_test("By-Bounds + Combined Filters", True, f"Retrieved {len(features)} critical fire incidents in bounds")
                else:
                    self.log_test("By-Bounds + Combined Filters", False, "Invalid response structure", data)
            else:
                self.log_test("By-Bounds + Combined Filters", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("By-Bounds Endpoint - Filters", False, f"Exception: {str(e)}")

    def test_analytics_summary_endpoint(self):
        """Test analytics summary endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/analytics/summary")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_incidents", "critical_incidents", "active_alerts", "avg_urgency_score", "incidents_today", "resolution_rate"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Analytics Summary", False, f"Missing fields: {missing_fields}", data)
                else:
                    self.log_test("Analytics Summary", True, f"Total incidents: {data['total_incidents']}, Critical: {data['critical_incidents']}")
            else:
                self.log_test("Analytics Summary", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Analytics Summary", False, f"Exception: {str(e)}")

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        try:
            # Test invalid bounds (south > north)
            params = {
                "north": 40.0,
                "south": 45.0,
                "east": -70.0,
                "west": -75.0
            }
            
            response = self.session.get(f"{self.base_url}/incidents/by-bounds", params=params)
            
            # Should either handle gracefully or return empty results
            if response.status_code == 200:
                data = response.json()
                if data.get("type") == "FeatureCollection":
                    self.log_test("Invalid Bounds Handling", True, f"Handled invalid bounds gracefully, returned {len(data.get('features', []))} features")
                else:
                    self.log_test("Invalid Bounds Handling", False, "Invalid response structure for invalid bounds", data)
            else:
                self.log_test("Invalid Bounds Handling", True, f"Properly rejected invalid bounds with HTTP {response.status_code}")

            # Test missing required parameters
            response = self.session.get(f"{self.base_url}/incidents/by-bounds")
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Missing Parameters Handling", True, "Properly rejected missing required parameters")
            else:
                self.log_test("Missing Parameters Handling", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Edge Cases", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests"""
        print(f"🚀 Starting DisasterWatch Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_health_endpoint()
        self.test_incidents_endpoint()
        self.test_incidents_map_endpoint()
        self.test_incidents_map_with_filters()
        self.test_incidents_by_bounds_endpoint()
        self.test_incidents_by_bounds_with_filters()
        self.test_analytics_summary_endpoint()
        self.test_edge_cases()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # List failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = DisasterWatchTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)