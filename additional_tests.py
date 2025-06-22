#!/usr/bin/env python3
"""
Additional tests for DRIFT Travel App Backend
This script tests the weather and OpenAI integration endpoints.
"""

import requests
import json
import time
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv("/app/frontend/.env")

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Testing additional endpoints at: {API_URL}")

def run_test(name, endpoint, method="GET", data=None, expected_status=200):
    """Run a test against an API endpoint"""
    url = f"{API_URL}/{endpoint}"
    print(f"\n{'='*80}\nTesting: {name}\nEndpoint: {url}\nMethod: {method}\n")
    
    if data:
        print(f"Request Data: {json.dumps(data, indent=2)}")
    
    start_time = time.time()
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=data, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=30)
        else:
            print(f"Unsupported method: {method}")
            return False
        
        elapsed_time = time.time() - start_time
        status_code = response.status_code
        
        try:
            response_data = response.json()
            print(f"Response ({status_code}, {elapsed_time:.2f}s): {json.dumps(response_data, indent=2)[:1000]}...")
        except:
            print(f"Response ({status_code}, {elapsed_time:.2f}s): {response.text[:500]}...")
            response_data = response.text
        
        # Check if status code matches expected
        if status_code == expected_status:
            print(f"✅ Test PASSED: {name}")
            return True
        else:
            print(f"❌ Test FAILED: {name}")
            print(f"  Expected status {expected_status}, got {status_code}")
            return False
        
    except Exception as e:
        print(f"❌ Test ERROR: {name}")
        print(f"  Exception: {str(e)}")
        return False

def main():
    """Main test function"""
    print("Testing additional DRIFT Travel App Backend endpoints")
    
    # Test weather endpoints
    run_test("Current Weather", "weather/current", method="GET", 
             data={"lat": 40.7128, "lng": -74.0060})  # New York coordinates
    
    run_test("Weather Forecast", "weather/forecast", method="GET", 
             data={"lat": 40.7128, "lng": -74.0060})  # New York coordinates
    
    # Test OpenAI integration endpoints
    itinerary_request = {
        "location": "New York City",
        "mood": "adventurous",
        "budget": "medium",
        "duration_hours": 8
    }
    run_test("Generate Itinerary", "itinerary/generate", method="POST", 
             data=itinerary_request)
    
    journal_request = {
        "entries": [
            {
                "date": "2023-07-01",
                "location": "New York City",
                "activities": ["Central Park visit", "Times Square", "Broadway show"],
                "notes": "Amazing day exploring NYC!"
            },
            {
                "date": "2023-07-02",
                "location": "New York City",
                "activities": ["Statue of Liberty", "Brooklyn Bridge", "Museum of Modern Art"],
                "notes": "Loved the art and architecture!"
            }
        ],
        "style": "reflective"
    }
    run_test("Generate Journal Recap", "journal/generate", method="POST", 
             data=journal_request)
    
    # Test Google Places integration endpoints
    places_request = {
        "query": "restaurants",
        "location": "New York City",
        "radius": 5000
    }
    run_test("Search Places", "places/search", method="POST", 
             data=places_request)
    
    run_test("Get Nearby Places", "places/nearby", method="GET", 
             data={"lat": 40.7128, "lng": -74.0060, "place_type": "restaurant", "radius": 1500})
    
    geocode_request = {
        "address": "New York City"
    }
    run_test("Geocode Location", "location/geocode", method="POST", 
             data=geocode_request)
    
    # Test Here-Now feature
    here_now_request = {
        "location": "New York City",
        "mood": "adventurous",
        "budget": "medium",
        "duration_hours": 4
    }
    run_test("Here-Now Plan", "here-now/plan", method="POST", 
             data=here_now_request)

if __name__ == "__main__":
    main()