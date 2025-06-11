#!/usr/bin/env python3
import requests
import json
import time
import os
from dotenv import load_dotenv

# Load environment variables from frontend/.env
load_dotenv("/app/frontend/.env")

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    exit(1)

# Ensure URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Testing backend API at: {API_URL}")

def test_status():
    print("\n=== Testing /api/status ===")
    url = f"{API_URL}/status"
    try:
        response = requests.get(url)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def test_geocode():
    print("\n=== Testing /api/location/geocode ===")
    url = f"{API_URL}/location/geocode"
    data = {"address": "San Francisco, CA"}
    try:
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def test_places_search():
    print("\n=== Testing /api/places/search ===")
    url = f"{API_URL}/places/search"
    data = {
        "query": "restaurants",
        "location": "San Francisco, CA",
        "radius": 1500
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def test_places_nearby():
    print("\n=== Testing /api/places/nearby ===")
    url = f"{API_URL}/places/nearby"
    params = {
        "lat": 37.7749,
        "lng": -122.4194,
        "place_type": "restaurant",
        "radius": 1500
    }
    try:
        response = requests.get(url, params=params)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def test_itinerary_generate():
    print("\n=== Testing /api/itinerary/generate ===")
    url = f"{API_URL}/itinerary/generate"
    data = {
        "location": "San Francisco, CA",
        "mood": "adventurous",
        "budget": "medium",
        "duration_hours": 6
    }
    try:
        start_time = time.time()
        response = requests.post(url, json=data)
        response_time = time.time() - start_time
        print(f"Response time: {response_time:.2f} seconds")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def test_here_now_plan():
    print("\n=== Testing /api/here-now/plan ===")
    url = f"{API_URL}/here-now/plan"
    data = {
        "location": "San Francisco, CA",
        "mood": "cultural",
        "budget": "medium",
        "duration_hours": 4
    }
    try:
        start_time = time.time()
        response = requests.post(url, json=data)
        response_time = time.time() - start_time
        print(f"Response time: {response_time:.2f} seconds")
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("Response data:")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {str(e)}")
        return False

def main():
    results = {
        "status": test_status(),
        "geocode": test_geocode(),
        "places_search": test_places_search(),
        "places_nearby": test_places_nearby(),
        "itinerary_generate": test_itinerary_generate(),
        "here_now_plan": test_here_now_plan()
    }
    
    print("\n=== Test Results ===")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    if all(results.values()):
        print("\n🎉 All tests passed!")
    else:
        print(f"\n❌ {list(results.values()).count(False)} tests failed")

if __name__ == "__main__":
    main()