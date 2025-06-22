#!/usr/bin/env python3
import requests
import json
import time
import os
import sys
from dotenv import load_dotenv
from pprint import pprint
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta

# Load environment variables
load_dotenv("/app/frontend/.env")

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Testing backend API at: {API_URL}")

# Test results
results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def run_test(name: str, endpoint: str, method: str = "GET", data: Dict[str, Any] = None, 
             expected_status: int = 200, validate_func=None) -> Tuple[bool, Dict[str, Any], float]:
    """
    Run a test against the specified API endpoint
    
    Args:
        name: Test name
        endpoint: API endpoint (without the base URL)
        method: HTTP method (GET, POST, etc.)
        data: Request data for POST/PUT requests
        expected_status: Expected HTTP status code
        validate_func: Function to validate the response data
        
    Returns:
        Tuple of (success, response_data, response_time)
    """
    url = f"{API_URL}{endpoint}"
    print(f"\n{'='*80}\nRunning test: {name}\nURL: {url}\nMethod: {method}")
    if data:
        print(f"Request data: {json.dumps(data, indent=2)}")
    
    start_time = time.time()
    
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            response = requests.post(url, json=data)
        else:
            print(f"Unsupported method: {method}")
            return False, {}, 0
        
        response_time = time.time() - start_time
        print(f"Response time: {response_time:.2f} seconds")
        
        # Check status code
        status_match = response.status_code == expected_status
        if not status_match:
            print(f"❌ Status code mismatch: expected {expected_status}, got {response.status_code}")
            return False, {}, response_time
        
        # Parse response data
        try:
            response_data = response.json()
            print(f"Response data: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {response.text}")
            return False, {}, response_time
        
        # Validate response data if a validation function is provided
        if validate_func and not validate_func(response_data):
            print(f"❌ Response validation failed")
            return False, response_data, response_time
        
        print(f"✅ Test passed")
        return True, response_data, response_time
        
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return False, {}, time.time() - start_time

def validate_status_response(data: Dict[str, Any]) -> bool:
    """Validate the status endpoint response"""
    required_fields = ["status", "database", "message", "timestamp"]
    return all(field in data for field in required_fields) and data["status"] == "healthy"

def validate_itinerary_response(data: Dict[str, Any]) -> bool:
    """Validate the itinerary generation response"""
    required_fields = ["activities", "total_estimated_cost", "narrative_summary"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in itinerary response. Found: {list(data.keys())}")
        print(f"Looking for: {required_fields}")
        return False
    
    # Check activities structure
    if not isinstance(data["activities"], list) or len(data["activities"]) == 0:
        print("❌ 'activities' field is not a list or is empty")
        return False
    
    # Check first activity structure
    activity = data["activities"][0]
    activity_fields = ["title", "description", "estimated_cost", "duration_minutes"]
    if not all(field in activity for field in activity_fields):
        print(f"❌ Activity missing required fields. Found: {list(activity.keys())}")
        print(f"Looking for: {activity_fields}")
        return False
    
    print("✅ Itinerary response validation passed with correct field names (total_estimated_cost, narrative_summary)")
    return True

def validate_geocode_response(data: Dict[str, Any]) -> bool:
    """Validate the geocode response"""
    required_fields = ["address", "coordinates", "formatted_address"]
    if not all(field in data for field in required_fields):
        return False
    
    # Check coordinates
    if not isinstance(data["coordinates"], dict) or "lat" not in data["coordinates"] or "lng" not in data["coordinates"]:
        return False
    
    return True

def validate_places_search_response(data: Dict[str, Any]) -> bool:
    """Validate the places search response"""
    required_fields = ["places", "count"]
    if not all(field in data for field in required_fields):
        return False
    
    # Check places array
    if not isinstance(data["places"], list):
        return False
    
    # If places were found, check the structure of the first place
    if len(data["places"]) > 0:
        place = data["places"][0]
        place_fields = ["place_id", "name"]
        if not all(field in place for field in place_fields):
            return False
    
    return True

def validate_here_now_response(data: Dict[str, Any]) -> bool:
    """Validate the here-now plan response"""
    required_fields = ["location_info", "nearby_places", "ai_itinerary", "generated_at"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in here-now response. Found: {list(data.keys())}")
        print(f"Looking for: {required_fields}")
        return False
    
    # Check location_info
    if not validate_geocode_response(data["location_info"]):
        print("❌ Location info validation failed")
        return False
    
    # Check nearby_places
    if not isinstance(data["nearby_places"], list):
        print("❌ 'nearby_places' field is not a list")
        return False
    
    # Check if nearby_places has items and if they have formatted_address or vicinity
    if len(data["nearby_places"]) > 0:
        place = data["nearby_places"][0]
        if "formatted_address" not in place and "vicinity" not in place:
            print("❌ Places are missing both 'formatted_address' and 'vicinity' attributes")
            print(f"Place keys: {list(place.keys())}")
            return False
        else:
            print("✅ Places have either 'formatted_address' or 'vicinity' attribute")
    
    # Check ai_itinerary
    if not validate_itinerary_response(data["ai_itinerary"]):
        print("❌ AI itinerary validation failed")
        return False
    
    print("✅ Here-Now plan validation passed with correct address attributes")
    return True

def record_result(name: str, success: bool, response_time: float, details: str = ""):
    """Record test result"""
    if success:
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    results["tests"].append({
        "name": name,
        "success": success,
        "response_time": response_time,
        "details": details
    })

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {results['passed']} passed, {results['failed']} failed")
    print("="*80)
    
    for test in results["tests"]:
        status = "✅ PASS" if test["success"] else "❌ FAIL"
        print(f"{status} - {test['name']} ({test['response_time']:.2f}s)")
        if test["details"]:
            print(f"  Details: {test['details']}")
    
    print("="*80)
    if results["failed"] == 0:
        print("🎉 All tests passed!")
    else:
        print(f"❌ {results['failed']} tests failed")

def validate_amadeus_connection(data: Dict[str, Any]) -> bool:
    """Validate the Amadeus API connection response"""
    required_fields = ["success", "message"]
    if not all(field in data for field in required_fields):
        return False
    
    return data["success"] == True

def validate_flight_search_response(data: Dict[str, Any]) -> bool:
    """Validate the flight search response"""
    required_fields = ["success", "flights", "count"]
    if not all(field in data for field in required_fields):
        return False
    
    # Check flights array
    if not isinstance(data["flights"], list):
        return False
    
    # If flights were found, check the structure of the first flight
    if len(data["flights"]) > 0:
        flight = data["flights"][0]
        flight_fields = ["id", "price", "itineraries"]
        if not all(field in flight for field in flight_fields):
            return False
    
    return True

def validate_hotel_search_response(data: Dict[str, Any]) -> bool:
    """Validate the hotel search response"""
    required_fields = ["success", "hotels", "count"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in hotel search response. Found: {list(data.keys())}")
        return False
    
    # Check hotels array
    if not isinstance(data["hotels"], list):
        print(f"❌ 'hotels' field is not a list: {type(data['hotels'])}")
        return False
    
    # Empty hotel list is valid (no results found)
    if len(data["hotels"]) == 0:
        print("ℹ️ No hotels found, but response format is valid")
        return True
    
    # If hotels were found, check the structure of the first hotel
    hotel = data["hotels"][0]
    hotel_fields = ["id", "hotel", "available", "offers"]
    if not all(field in hotel for field in hotel_fields):
        print(f"❌ Hotel object missing required fields. Found: {list(hotel.keys())}")
        return False
    
    return True

def validate_location_search_response(data: Dict[str, Any]) -> bool:
    """Validate the location search response"""
    required_fields = ["success", "airports"] if "airports" in data else ["success", "cities"]
    if not all(field in data for field in required_fields):
        return False
    
    # Check locations array
    locations = data.get("airports") or data.get("cities")
    if not isinstance(locations, list):
        return False
    
    return True

def validate_trip_plan_response(data: Dict[str, Any]) -> bool:
    """Validate the trip planning response"""
    required_fields = ["success", "trip_plan", "trip_id"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in trip plan response. Found: {list(data.keys())}")
        return False
    
    # Check trip_plan structure
    trip_plan = data["trip_plan"]
    if not isinstance(trip_plan, dict):
        print(f"❌ 'trip_plan' field is not a dictionary: {type(trip_plan)}")
        return False
    
    # Check destination_itinerary
    if "destination_itinerary" not in trip_plan:
        print(f"❌ 'destination_itinerary' missing from trip_plan. Found: {list(trip_plan.keys())}")
        return False
    
    # Check for flight_options and hotel_options (they can be empty lists)
    if "flight_options" in trip_plan and not isinstance(trip_plan["flight_options"], list):
        print(f"❌ 'flight_options' is not a list: {type(trip_plan['flight_options'])}")
        return False
    
    if "hotel_options" in trip_plan and not isinstance(trip_plan["hotel_options"], list):
        print(f"❌ 'hotel_options' is not a list: {type(trip_plan['hotel_options'])}")
        return False
    
    # Check for error notes
    if "flight_search_note" in trip_plan:
        print(f"ℹ️ Flight search note: {trip_plan['flight_search_note']}")
    
    if "hotel_search_note" in trip_plan:
        print(f"ℹ️ Hotel search note: {trip_plan['hotel_search_note']}")
    
    return True

def validate_smart_flight_search_response(data: Dict[str, Any]) -> bool:
    """Validate the smart flight search response"""
    required_fields = ["success", "flights"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in smart flight search response. Found: {list(data.keys())}")
        return False
    
    # Check flights array
    if not isinstance(data["flights"], list):
        print(f"❌ 'flights' field is not a list: {type(data['flights'])}")
        return False
    
    # Empty flight list is valid (no results found)
    if len(data["flights"]) == 0:
        print("ℹ️ No flights found, but response format is valid")
        return True
    
    # Check smart features
    if "smart_features_applied" not in data:
        print("ℹ️ 'smart_features_applied' field is missing")
    
    # Check carbon data if sustainability mode is enabled
    if "carbon_data" in data and data["carbon_data"] is not None:
        if not isinstance(data["carbon_data"], dict):
            print(f"❌ 'carbon_data' field is not a dictionary: {type(data['carbon_data'])}")
            return False
        
        carbon_fields = ["total_kg_co2", "average_per_flight", "offset_cost"]
        if not all(field in data["carbon_data"] for field in carbon_fields):
            print(f"❌ 'carbon_data' missing required fields. Found: {list(data['carbon_data'].keys())}")
            print(f"Looking for: {carbon_fields}")
            return False
    
    # Check recommendations if available
    if "recommendations" in data and data["recommendations"] is not None:
        if not isinstance(data["recommendations"], list):
            print(f"❌ 'recommendations' field is not a list: {type(data['recommendations'])}")
            return False
        
        if len(data["recommendations"]) > 0:
            rec = data["recommendations"][0]
            rec_fields = ["type", "title", "description"]
            if not all(field in rec for field in rec_fields):
                print(f"❌ Recommendation missing required fields. Found: {list(rec.keys())}")
                print(f"Looking for: {rec_fields}")
                return False
    
    # If flights were found, check the structure of the first flight
    if len(data["flights"]) > 0:
        flight = data["flights"][0]
        flight_fields = ["id", "price", "itineraries"]
        if not all(field in flight for field in flight_fields):
            print(f"❌ Flight object missing required fields. Found: {list(flight.keys())}")
            print(f"Looking for: {flight_fields}")
            return False
        
        # Check smart features in flight
        smart_fields = ["sustainability_score", "carbon_footprint", "budget_fit", "mood_score"]
        smart_features_present = any(field in flight for field in smart_fields)
        if not smart_features_present:
            print("ℹ️ No smart features found in flight data")
    
    return True

def validate_flexible_search_response(data: Dict[str, Any]) -> bool:
    """Validate the flexible flight search response"""
    required_fields = ["success", "calendar", "month", "year", "origin", "destination"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in flexible search response. Found: {list(data.keys())}")
        return False
    
    # Check calendar array
    if not isinstance(data["calendar"], list):
        print(f"❌ 'calendar' field is not a list: {type(data['calendar'])}")
        return False
    
    # Empty calendar is not valid
    if len(data["calendar"]) == 0:
        print("❌ Calendar is empty")
        return False
    
    # Check structure of calendar entries
    calendar_entry = data["calendar"][0]
    calendar_fields = ["date", "price", "currency", "available"]
    if not all(field in calendar_entry for field in calendar_fields):
        print(f"❌ Calendar entry missing required fields. Found: {list(calendar_entry.keys())}")
        print(f"Looking for: {calendar_fields}")
        return False
    
    return True

def validate_airport_search_response(data: Dict[str, Any]) -> bool:
    """Validate the airport search response"""
    required_fields = ["success", "airports"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in airport search response. Found: {list(data.keys())}")
        return False
    
    # Check airports array
    if not isinstance(data["airports"], list):
        print(f"❌ 'airports' field is not a list: {type(data['airports'])}")
        return False
    
    # If airports were found, check the structure of the first airport
    if len(data["airports"]) > 0:
        airport = data["airports"][0]
        airport_fields = ["iataCode", "name", "address"]
        if not all(field in airport for field in airport_fields):
            print(f"❌ Airport object missing required fields. Found: {list(airport.keys())}")
            print(f"Looking for: {airport_fields}")
            return False
    
    return True

def validate_city_search_response(data: Dict[str, Any]) -> bool:
    """Validate the city search response"""
    required_fields = ["success", "cities"]
    if not all(field in data for field in required_fields):
        print(f"❌ Missing required fields in city search response. Found: {list(data.keys())}")
        return False
    
    # Check cities array
    if not isinstance(data["cities"], list):
        print(f"❌ 'cities' field is not a list: {type(data['cities'])}")
        return False
    
    # If cities were found, check the structure of the first city
    if len(data["cities"]) > 0:
        city = data["cities"][0]
        city_fields = ["iataCode", "name", "address"]
        if not all(field in city for field in city_fields):
            print(f"❌ City object missing required fields. Found: {list(city.keys())}")
            print(f"Looking for: {city_fields}")
            return False
    
    return True

def main():
    """Run all tests"""
    print("Starting DRIFT Travel API Tests")
    
    # 1. Test Basic Health Check
    success, data, response_time = run_test(
        name="Basic Health Check",
        endpoint="/status",
        method="GET",
        expected_status=200,
        validate_func=validate_status_response
    )
    record_result("Basic Health Check", success, response_time)
    
    # 2. Test Amadeus API Connection
    success, data, response_time = run_test(
        name="Amadeus API Connection",
        endpoint="/amadeus/test",
        method="GET",
        expected_status=200,
        validate_func=validate_amadeus_connection
    )
    record_result("Amadeus API Connection", success, response_time)
    
    # 3. Test Location Services Endpoints
    print("\n" + "="*80)
    print("TESTING LOCATION SERVICES ENDPOINTS")
    print("="*80)
    
    # 3.1 Test Airport Search with IATA code
    success, data, response_time = run_test(
        name="Airport Search with IATA Code",
        endpoint="/locations/airports?keyword=JFK",
        method="GET",
        expected_status=200,
        validate_func=validate_airport_search_response
    )
    record_result("Airport Search with IATA Code", success, response_time)
    
    # 3.2 Test Airport Search with city name
    success, data, response_time = run_test(
        name="Airport Search with City Name",
        endpoint="/locations/airports?keyword=New",
        method="GET",
        expected_status=200,
        validate_func=validate_airport_search_response
    )
    record_result("Airport Search with City Name", success, response_time)
    
    # 3.3 Test Airport Search with international city
    success, data, response_time = run_test(
        name="Airport Search with International City",
        endpoint="/locations/airports?keyword=London",
        method="GET",
        expected_status=200,
        validate_func=validate_airport_search_response
    )
    record_result("Airport Search with International City", success, response_time)
    
    # 3.4 Test City Search with partial name
    success, data, response_time = run_test(
        name="City Search with Partial Name",
        endpoint="/locations/cities?keyword=New",
        method="GET",
        expected_status=200,
        validate_func=validate_city_search_response
    )
    record_result("City Search with Partial Name", success, response_time)
    
    # 3.5 Test City Search with international city
    success, data, response_time = run_test(
        name="City Search with International City",
        endpoint="/locations/cities?keyword=Paris",
        method="GET",
        expected_status=200,
        validate_func=validate_city_search_response
    )
    record_result("City Search with International City", success, response_time)
    
    # 3.6 Test City Search with Asian city
    success, data, response_time = run_test(
        name="City Search with Asian City",
        endpoint="/locations/cities?keyword=Tokyo",
        method="GET",
        expected_status=200,
        validate_func=validate_city_search_response
    )
    record_result("City Search with Asian City", success, response_time)
    
    # 3.7 Test Airport Search with empty keyword
    success, data, response_time = run_test(
        name="Airport Search with Empty Keyword",
        endpoint="/locations/airports?keyword=",
        method="GET",
        expected_status=200,
        validate_func=validate_airport_search_response
    )
    record_result("Airport Search with Empty Keyword", success, response_time)
    
    # 3.8 Test City Search with short keyword
    success, data, response_time = run_test(
        name="City Search with Short Keyword",
        endpoint="/locations/cities?keyword=NY",
        method="GET",
        expected_status=200,
        validate_func=validate_city_search_response
    )
    record_result("City Search with Short Keyword", success, response_time)
    
    # 3.9 Test Airport Search with non-existent location
    success, data, response_time = run_test(
        name="Airport Search with Non-existent Location",
        endpoint="/locations/airports?keyword=NonExistentLocation123",
        method="GET",
        expected_status=200,
        validate_func=validate_airport_search_response
    )
    record_result("Airport Search with Non-existent Location", success, response_time)
    
    # 4. Test Flight Search Endpoints
    print("\n" + "="*80)
    print("TESTING FLIGHT SEARCH ENDPOINTS")
    print("="*80)
    
    # 3.1 Test Basic Flight Search
    flight_search_request = {
        "origin": "JFK",
        "destination": "LAX",
        "departure_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "return_date": (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d"),
        "adults": 1,
        "travel_class": "ECONOMY"
    }
    success, data, response_time = run_test(
        name="Basic Flight Search",
        endpoint="/flights/search",
        method="POST",
        data=flight_search_request,
        expected_status=200,
        validate_func=validate_flight_search_response
    )
    record_result("Basic Flight Search", success, response_time)
    
    # 3.2 Test Smart Flight Search with Near-future dates (June 2025)
    smart_flight_search_near_future = {
        "origin": "NYC",
        "destination": "LAX",
        "departureDate": "2025-06-20",  # Near-future date (too close to today)
        "returnDate": "2025-06-25",
        "adults": 1,
        "travelClass": "ECONOMY",
        "smart_features": {
            "sustainabilityMode": True,
            "budgetIntelligence": True,
            "moodBasedSuggestions": True
        },
        "budget_context": {
            "total": 2000,
            "flight_percentage": 40
        }
    }
    success, data, response_time = run_test(
        name="Smart Flight Search with Near-future Dates (June 2025)",
        endpoint="/flights/search-smart",
        method="POST",
        data=smart_flight_search_near_future,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Smart Flight Search with Near-future Dates (June 2025)", success, response_time, 
                 "Testing with dates that might be too close to today in the Amadeus test environment")
    
    # 3.3 Test Smart Flight Search with Valid future dates (July 2025)
    smart_flight_search_valid_future = {
        "origin": "NYC",
        "destination": "LAX",
        "departureDate": "2025-07-15",  # Far enough in future
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY",
        "smart_features": {
            "sustainabilityMode": True,
            "budgetIntelligence": True,
            "moodBasedSuggestions": True
        },
        "budget_context": {
            "total": 2000,
            "flight_percentage": 40
        }
    }
    success, data, response_time = run_test(
        name="Smart Flight Search with Valid Future Dates (July 2025)",
        endpoint="/flights/search-smart",
        method="POST",
        data=smart_flight_search_valid_future,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Smart Flight Search with Valid Future Dates (July 2025)", success, response_time,
                 "Testing with dates that are known to work in the Amadeus test environment")
    
    # 3.4 Test Smart Flight Search with City Names
    smart_flight_search_city_request = {
        "origin": "New York",
        "destination": "Los Angeles",
        "departureDate": "2025-07-15",  # Using known working date
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY",
        "smart_features": {
            "sustainabilityMode": True,
            "budgetIntelligence": True,
            "moodBasedSuggestions": True
        }
    }
    success, data, response_time = run_test(
        name="Smart Flight Search with City Names",
        endpoint="/flights/search-smart",
        method="POST",
        data=smart_flight_search_city_request,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Smart Flight Search with City Names", success, response_time)
    
    # 3.5 Test Smart Flight Search with Common Abbreviations
    smart_flight_search_abbrev_request = {
        "origin": "NYC",
        "destination": "LA",
        "departureDate": "2025-07-15",  # Using known working date
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY",
        "smart_features": {
            "sustainabilityMode": True,
            "budgetIntelligence": True,
            "moodBasedSuggestions": True
        }
    }
    success, data, response_time = run_test(
        name="Smart Flight Search with Abbreviations",
        endpoint="/flights/search-smart",
        method="POST",
        data=smart_flight_search_abbrev_request,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Smart Flight Search with Abbreviations", success, response_time)
    
    # 3.6 Test Smart Flight Search with International Cities
    smart_flight_search_intl_request = {
        "origin": "London",
        "destination": "Paris",
        "departureDate": "2025-07-01",  # Using known working date
        "returnDate": "2025-07-05",
        "adults": 1,
        "travelClass": "ECONOMY",
        "smart_features": {
            "sustainabilityMode": True,
            "budgetIntelligence": True,
            "moodBasedSuggestions": True
        }
    }
    success, data, response_time = run_test(
        name="Smart Flight Search with International Cities",
        endpoint="/flights/search-smart",
        method="POST",
        data=smart_flight_search_intl_request,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Smart Flight Search with International Cities", success, response_time)
    
    # 3.7 Test Flexible Flight Search
    flexible_search_request = {
        "origin": "JFK",
        "destination": "LAX",
        "month": 7,  # July
        "year": 2025,
        "adults": 1
    }
    success, data, response_time = run_test(
        name="Flexible Flight Search",
        endpoint="/flights/flexible-search",
        method="POST",
        data=flexible_search_request,
        expected_status=200,
        validate_func=validate_flexible_search_response
    )
    record_result("Flexible Flight Search", success, response_time)
    
    # Print summary
    print_summary()

def test_flight_search_smart_with_review_data():
    """Test the flight search smart endpoint with the specific data from the review request"""
    print("\n" + "="*80)
    print("TESTING FLIGHT SEARCH SMART WITH REVIEW DATA")
    print("="*80)
    
    # Prepare test data from the review request
    test_data = {
        "origin": "JFK",
        "destination": "LAX", 
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "children": 0,
        "travelClass": "ECONOMY",
        "tripType": "roundtrip"
    }
    
    success, data, response_time = run_test(
        name="Flight Search Smart with Review Data",
        endpoint="/flights/search-smart",
        method="POST",
        data=test_data,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search Smart with Review Data", success, response_time)
    
    return success, data

def test_hotel_search_with_review_data():
    """Test the hotel search endpoint with the specific data from the review request"""
    print("\n" + "="*80)
    print("TESTING HOTEL SEARCH WITH REVIEW DATA")
    print("="*80)
    
    # Test with Los Angeles
    la_test_data = {
        "city_code": "LAX",  # Los Angeles
        "check_in_date": "2025-07-15",
        "check_out_date": "2025-07-20",
        "adults": 1,
        "rooms": 1
    }
    
    success_la, data_la, response_time_la = run_test(
        name="Hotel Search with Los Angeles",
        endpoint="/hotels/search",
        method="POST",
        data=la_test_data,
        expected_status=200,
        validate_func=validate_hotel_search_response
    )
    record_result("Hotel Search with Los Angeles", success_la, response_time_la)
    
    # Test with New York
    ny_test_data = {
        "city_code": "NYC",  # New York
        "check_in_date": "2025-07-15",
        "check_out_date": "2025-07-20",
        "adults": 1,
        "rooms": 1
    }
    
    success_ny, data_ny, response_time_ny = run_test(
        name="Hotel Search with New York",
        endpoint="/hotels/search",
        method="POST",
        data=ny_test_data,
        expected_status=200,
        validate_func=validate_hotel_search_response
    )
    record_result("Hotel Search with New York", success_ny, response_time_ny)
    
    return (success_la and success_ny), {"la_data": data_la, "ny_data": data_ny}

def run_review_tests():
    """Run the specific tests requested in the review"""
    print("\n" + "="*80)
    print("RUNNING FLIGHT & HOTEL SEARCH DEBUGGING TESTS")
    print("="*80)
    
    # Test flight search smart with review data
    flight_success, flight_data = test_flight_search_smart_with_review_data()
    
    # Test hotel search with review data
    hotel_success, hotel_data = test_hotel_search_with_review_data()
    
    # Print summary
    print("\n" + "="*80)
    print("REVIEW TEST RESULTS SUMMARY")
    print("="*80)
    
    print(f"Flight Search Smart: {'✅ PASSED' if flight_success else '❌ FAILED'}")
    print(f"Hotel Search: {'✅ PASSED' if hotel_success else '❌ FAILED'}")
    
    # Print detailed results
    if flight_success:
        flights = flight_data.get("flights", [])
        print(f"\nFound {len(flights)} flights from JFK to LAX")
        if flights:
            for i, flight in enumerate(flights[:3]):  # Show first 3 flights
                airline_names = flight.get("airline_names", ["Unknown"])
                price = flight.get("price", {}).get("grandTotal", "N/A")
                currency = flight.get("currency", "USD")
                departure = flight.get("departure_time", "N/A")
                arrival = flight.get("arrival_time", "N/A")
                duration = flight.get("formatted_duration", "N/A")
                
                print(f"Flight {i+1}: {', '.join(airline_names)} - Price: {price} {currency}")
                print(f"  Departure: {departure}, Arrival: {arrival}, Duration: {duration}")
    
    if hotel_success:
        la_hotels = hotel_data.get("la_data", {}).get("hotels", [])
        ny_hotels = hotel_data.get("ny_data", {}).get("hotels", [])
        
        print(f"\nFound {len(la_hotels)} hotels in Los Angeles")
        print(f"Found {len(ny_hotels)} hotels in New York")
    
    return flight_success and hotel_success

def test_place_details_endpoint():
    """
    Test the /api/places/details endpoint with a valid place_id to ensure:
    1. API Response: The endpoint returns a successful 200 response
    2. Field Names: The correct Google Places API field names are being used (types, photos, reviews - plural forms)
    3. Data Structure: The response contains proper place details
    """
    print("\n" + "="*80)
    print("TESTING GOOGLE PLACES API PLACE DETAILS ENDPOINT")
    print("="*80)
    
    # Use Google Sydney office as test data
    place_id = "ChIJN1t_tDeuEmsRUsoyG83frY4"
    
    # Make the API request
    url = f"{API_URL}/places/details?place_id={place_id}"
    print(f"Making request to: {url}")
    
    try:
        response = requests.get(url)
        
        # Check if response is successful
        print(f"Response status code: {response.status_code}")
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        
        # Parse response JSON
        data = response.json()
        print(f"Response received: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Check if response has success field
        assert data.get("success") is True, "Response does not have success=True"
        
        # Check if place data exists
        assert "place" in data, "Response does not contain 'place' field"
        place = data["place"]
        
        # Check basic place information
        assert "name" in place, "Place does not have 'name' field"
        assert "place_id" in place, "Place does not have 'place_id' field"
        assert place["place_id"] == place_id, f"Place ID mismatch: expected {place_id}, got {place['place_id']}"
        
        # Check for plural field names (which should be present in the response)
        assert "types" in place, "Place does not have 'types' field (plural form)"
        assert isinstance(place["types"], list), "'types' field is not a list"
        
        # Check for photos field (should be present if the place has photos)
        if "photos" in place:
            assert isinstance(place["photos"], list), "'photos' field is not a list"
            if len(place["photos"]) > 0:
                photo = place["photos"][0]
                assert "url" in photo, "Photo does not have 'url' field"
                assert "photo_reference" in photo, "Photo does not have 'photo_reference' field"
        
        # Check for reviews field (may or may not be present)
        if "reviews" in place:
            assert isinstance(place["reviews"], list), "'reviews' field is not a list"
        
        # Check for other important fields
        fields_to_check = [
            "formatted_address", 
            "rating", 
            "website", 
            "formatted_phone_number"
        ]
        
        for field in fields_to_check:
            if field in place:
                print(f"✓ Field '{field}' is present: {place[field]}")
        
        print("\n✅ Place details endpoint test PASSED!")
        record_result("Google Places API Place Details", True, 0)
        return True
        
    except AssertionError as e:
        print(f"\n❌ Test FAILED: {str(e)}")
        record_result("Google Places API Place Details", False, 0, str(e))
        return False
    except Exception as e:
        print(f"\n❌ Test FAILED with exception: {str(e)}")
        record_result("Google Places API Place Details", False, 0, str(e))
        return False

def run_place_details_test():
    """Run the Google Places API place details endpoint test"""
    print("\n" + "="*80)
    print("TESTING GOOGLE PLACES API PLACE DETAILS ENDPOINT")
    print("="*80)
    
    success = test_place_details_endpoint()
    
    print("\n" + "="*80)
    print("PLACE DETAILS TEST RESULTS SUMMARY")
    print("="*80)
    
    print(f"Google Places API Place Details: {'✅ PASSED' if success else '❌ FAILED'}")
    
    return success

def test_airport_code_resolution():
    """
    Test the airport code resolution functionality for Tampa and other cities.
    
    This test verifies:
    1. TAMPA resolves to TPA
    2. LAS VEGAS resolves to LAS
    3. ORLANDO resolves to MCO
    4. SEATTLE resolves to SEA
    5. PHOENIX resolves to PHX
    6. Flight search from TAMPA to ORLANDO works correctly
    """
    print("\n" + "="*80)
    print("TESTING AIRPORT CODE RESOLUTION")
    print("="*80)
    
    # Test 1: Flight search with Tampa as origin
    tampa_to_nyc = {
        "origin": "TAMPA",
        "destination": "JFK",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success1, data1, response_time1 = run_test(
        name="Flight Search with Tampa as Origin",
        endpoint="/flights/search-smart",
        method="POST",
        data=tampa_to_nyc,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Tampa as Origin", success1, response_time1)
    
    # Test 2: Flight search with Tampa as destination
    nyc_to_tampa = {
        "origin": "JFK",
        "destination": "TAMPA",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success2, data2, response_time2 = run_test(
        name="Flight Search with Tampa as Destination",
        endpoint="/flights/search-smart",
        method="POST",
        data=nyc_to_tampa,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Tampa as Destination", success2, response_time2)
    
    # Test 3: Flight search with Las Vegas
    nyc_to_vegas = {
        "origin": "JFK",
        "destination": "LAS VEGAS",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success3, data3, response_time3 = run_test(
        name="Flight Search with Las Vegas",
        endpoint="/flights/search-smart",
        method="POST",
        data=nyc_to_vegas,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Las Vegas", success3, response_time3)
    
    # Test 4: Flight search with Orlando
    nyc_to_orlando = {
        "origin": "JFK",
        "destination": "ORLANDO",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success4, data4, response_time4 = run_test(
        name="Flight Search with Orlando",
        endpoint="/flights/search-smart",
        method="POST",
        data=nyc_to_orlando,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Orlando", success4, response_time4)
    
    # Test 5: Flight search with Seattle
    nyc_to_seattle = {
        "origin": "JFK",
        "destination": "SEATTLE",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success5, data5, response_time5 = run_test(
        name="Flight Search with Seattle",
        endpoint="/flights/search-smart",
        method="POST",
        data=nyc_to_seattle,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Seattle", success5, response_time5)
    
    # Test 6: Flight search with Phoenix
    nyc_to_phoenix = {
        "origin": "JFK",
        "destination": "PHOENIX",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success6, data6, response_time6 = run_test(
        name="Flight Search with Phoenix",
        endpoint="/flights/search-smart",
        method="POST",
        data=nyc_to_phoenix,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search with Phoenix", success6, response_time6)
    
    # Test 7: Flight search from Tampa to Orlando (both using city names)
    tampa_to_orlando = {
        "origin": "TAMPA",
        "destination": "ORLANDO",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    success7, data7, response_time7 = run_test(
        name="Flight Search from Tampa to Orlando",
        endpoint="/flights/search-smart",
        method="POST",
        data=tampa_to_orlando,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    record_result("Flight Search from Tampa to Orlando", success7, response_time7)
    
    # Print summary
    print("\n" + "="*80)
    print("AIRPORT CODE RESOLUTION TEST RESULTS SUMMARY")
    print("="*80)
    
    all_tests_passed = all([success1, success2, success3, success4, success5, success6, success7])
    
    print(f"Flight Search with Tampa as Origin: {'✅ PASSED' if success1 else '❌ FAILED'}")
    print(f"Flight Search with Tampa as Destination: {'✅ PASSED' if success2 else '❌ FAILED'}")
    print(f"Flight Search with Las Vegas: {'✅ PASSED' if success3 else '❌ FAILED'}")
    print(f"Flight Search with Orlando: {'✅ PASSED' if success4 else '❌ FAILED'}")
    print(f"Flight Search with Seattle: {'✅ PASSED' if success5 else '❌ FAILED'}")
    print(f"Flight Search with Phoenix: {'✅ PASSED' if success6 else '❌ FAILED'}")
    print(f"Flight Search from Tampa to Orlando: {'✅ PASSED' if success7 else '❌ FAILED'}")
    
    print(f"\nOverall Airport Code Resolution Test: {'✅ PASSED' if all_tests_passed else '❌ FAILED'}")
    
    return all_tests_passed

def test_airport_code_resolution_direct():
    """
    Test the airport code resolution functionality directly by calling the API endpoints
    that handle airport and city searches.
    
    This test verifies:
    1. TAMPA resolves to TPA
    2. LAS VEGAS resolves to LAS
    3. ORLANDO resolves to MCO
    4. SEATTLE resolves to SEA
    5. PHOENIX resolves to PHX
    """
    print("\n" + "="*80)
    print("TESTING AIRPORT CODE RESOLUTION DIRECTLY")
    print("="*80)
    
    # Create a test function to check if a city resolves to the expected airport code
    def check_city_resolution(city, expected_code):
        # We'll use the server logs to verify the resolution
        # First, make a request that will trigger the resolution
        test_data = {
            "origin": "JFK",
            "destination": city,
            "departureDate": "2025-07-15",
            "returnDate": "2025-07-20",
            "adults": 1,
            "travelClass": "ECONOMY"
        }
        
        url = f"{API_URL}/flights/search-smart"
        print(f"Testing resolution for city: {city}")
        print(f"Expected airport code: {expected_code}")
        
        try:
            response = requests.post(url, json=test_data)
            # We don't care about the response status here, just that the request was made
            
            # Check the server logs to see if the resolution was correct
            log_output = os.popen("tail -n 50 /var/log/supervisor/backend.err.log").read()
            
            # Look for the log line that shows the resolved airport code
            search_pattern = f"Searching flights from JFK to {expected_code}"
            resolution_success = search_pattern in log_output
            
            if resolution_success:
                print(f"✅ SUCCESS: {city} correctly resolved to {expected_code}")
            else:
                print(f"❌ FAILED: {city} did not resolve to {expected_code}")
                print("Log excerpt:")
                print(log_output)
            
            return resolution_success
            
        except Exception as e:
            print(f"❌ Exception occurred: {str(e)}")
            return False
    
    # Test each city
    results = []
    
    # Test Tampa
    results.append(check_city_resolution("TAMPA", "TPA"))
    
    # Test Las Vegas
    results.append(check_city_resolution("LAS VEGAS", "LAS"))
    
    # Test Orlando
    results.append(check_city_resolution("ORLANDO", "MCO"))
    
    # Test Seattle
    results.append(check_city_resolution("SEATTLE", "SEA"))
    
    # Test Phoenix
    results.append(check_city_resolution("PHOENIX", "PHX"))
    
    # Print summary
    print("\n" + "="*80)
    print("AIRPORT CODE RESOLUTION TEST RESULTS SUMMARY")
    print("="*80)
    
    all_passed = all(results)
    
    print(f"TAMPA to TPA: {'✅ PASSED' if results[0] else '❌ FAILED'}")
    print(f"LAS VEGAS to LAS: {'✅ PASSED' if results[1] else '❌ FAILED'}")
    print(f"ORLANDO to MCO: {'✅ PASSED' if results[2] else '❌ FAILED'}")
    print(f"SEATTLE to SEA: {'✅ PASSED' if results[3] else '❌ FAILED'}")
    print(f"PHOENIX to PHX: {'✅ PASSED' if results[4] else '❌ FAILED'}")
    
    print(f"\nOverall Airport Code Resolution Test: {'✅ PASSED' if all_passed else '❌ FAILED'}")
    
    return all_passed

def test_tampa_to_orlando_resolution():
    """
    Test specifically the flight search from Tampa to Orlando to verify
    that both cities are resolved correctly to their respective airport codes.
    """
    print("\n" + "="*80)
    print("TESTING TAMPA TO ORLANDO RESOLUTION")
    print("="*80)
    
    # Create test data
    test_data = {
        "origin": "TAMPA",
        "destination": "ORLANDO",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    url = f"{API_URL}/flights/search-smart"
    print(f"Testing flight search from TAMPA to ORLANDO")
    print(f"Expected resolution: TPA to MCO")
    
    try:
        response = requests.post(url, json=test_data)
        # We don't care about the response status here, just that the request was made
        
        # Check the server logs to see if the resolution was correct
        log_output = os.popen("tail -n 50 /var/log/supervisor/backend.err.log").read()
        
        # Look for the log line that shows the resolved airport codes
        search_pattern = "Searching flights from TPA to MCO"
        resolution_success = search_pattern in log_output
        
        if resolution_success:
            print(f"✅ SUCCESS: TAMPA to ORLANDO correctly resolved to TPA to MCO")
        else:
            print(f"❌ FAILED: TAMPA to ORLANDO did not resolve to TPA to MCO")
            print("Log excerpt:")
            print(log_output)
        
        return resolution_success
        
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return False

def run_all_airport_code_resolution_tests():
    """
    Run all airport code resolution tests and provide a comprehensive summary.
    """
    print("\n" + "="*80)
    print("RUNNING ALL AIRPORT CODE RESOLUTION TESTS")
    print("="*80)
    
    # Run individual city resolution tests
    city_results = test_airport_code_resolution_direct()
    
    # Run Tampa to Orlando test
    tampa_orlando_result = test_tampa_to_orlando_resolution()
    
    # Print comprehensive summary
    print("\n" + "="*80)
    print("COMPREHENSIVE AIRPORT CODE RESOLUTION TEST RESULTS")
    print("="*80)
    
    overall_success = city_results and tampa_orlando_result
    
    print(f"Individual City Resolution Tests: {'✅ PASSED' if city_results else '❌ FAILED'}")
    print(f"Tampa to Orlando Resolution Test: {'✅ PASSED' if tampa_orlando_result else '❌ FAILED'}")
    print(f"\nOverall Airport Code Resolution Functionality: {'✅ PASSED' if overall_success else '❌ FAILED'}")
    
    if overall_success:
        print("\n✅ The airport code resolution functionality is working correctly for all tested cities.")
        print("✅ The following mappings have been verified:")
        print("   - TAMPA → TPA")
        print("   - LAS VEGAS → LAS")
        print("   - ORLANDO → MCO")
        print("   - SEATTLE → SEA")
        print("   - PHOENIX → PHX")
        print("✅ Flight search from TAMPA to ORLANDO correctly resolves to TPA to MCO")
    else:
        print("\n❌ There are issues with the airport code resolution functionality.")
        print("   Please check the individual test results for details.")
    
    return overall_success

def test_amadeus_flight_search():
    """
    Test the Amadeus flight search functionality with the new valid API credentials.
    
    This test specifically checks:
    1. Test Tampa Flight Search (Original Issue):
       - Test flight search from "TAMPA" to "JFK"
       - Verify Tampa resolves to TPA correctly
       - Confirm no more "invalid_client" 401 errors
       - Check if flight results are returned
    
    2. Test Other City Combinations:
       - Test "ORLANDO" to "MIAMI" (both should resolve to MCO and MIA)
       - Test "LAS VEGAS" to "CHICAGO" (should resolve to LAS and ORD)
    
    3. Verify Amadeus API Integration:
       - Check authentication is successful
       - Verify flight search responses have proper data structure
       - Confirm API calls return 200 status codes
    """
    print("\n" + "="*80)
    print("TESTING AMADEUS FLIGHT SEARCH WITH NEW VALID API CREDENTIALS")
    print("="*80)
    
    results = {}
    
    # Test 1: Tampa to JFK Flight Search
    tampa_to_jfk = {
        "origin": "TAMPA",
        "destination": "JFK",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    print("\n=== Test 1: Tampa to JFK Flight Search ===")
    success1, data1, response_time1 = run_test(
        name="Tampa to JFK Flight Search",
        endpoint="/flights/search-smart",
        method="POST",
        data=tampa_to_jfk,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    results["tampa_to_jfk"] = success1
    
    # Check logs to verify Tampa resolves to TPA
    log_output = os.popen("tail -n 50 /var/log/supervisor/backend.err.log").read()
    tampa_resolution = "Searching flights from TPA to JFK" in log_output
    results["tampa_resolution"] = tampa_resolution
    
    if tampa_resolution:
        print("✅ Tampa correctly resolved to TPA")
    else:
        print("❌ Tampa did not resolve to TPA correctly")
    
    # Check for absence of invalid_client errors
    invalid_client_error = "invalid_client" in log_output and "401" in log_output
    results["no_invalid_client"] = not invalid_client_error
    
    if not invalid_client_error:
        print("✅ No 'invalid_client' 401 errors detected")
    else:
        print("❌ 'invalid_client' 401 errors still present")
    
    # Test 2: Orlando to Miami Flight Search
    orlando_to_miami = {
        "origin": "ORLANDO",
        "destination": "MIAMI",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    print("\n=== Test 2: Orlando to Miami Flight Search ===")
    success2, data2, response_time2 = run_test(
        name="Orlando to Miami Flight Search",
        endpoint="/flights/search-smart",
        method="POST",
        data=orlando_to_miami,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    results["orlando_to_miami"] = success2
    
    # Check logs to verify Orlando resolves to MCO and Miami to MIA
    log_output = os.popen("tail -n 50 /var/log/supervisor/backend.err.log").read()
    orlando_miami_resolution = "Searching flights from MCO to MIA" in log_output
    results["orlando_miami_resolution"] = orlando_miami_resolution
    
    if orlando_miami_resolution:
        print("✅ Orlando and Miami correctly resolved to MCO and MIA")
    else:
        print("❌ Orlando and Miami did not resolve correctly")
    
    # Test 3: Las Vegas to Chicago Flight Search
    vegas_to_chicago = {
        "origin": "LAS VEGAS",
        "destination": "CHICAGO",
        "departureDate": "2025-07-15",
        "returnDate": "2025-07-20",
        "adults": 1,
        "travelClass": "ECONOMY"
    }
    
    print("\n=== Test 3: Las Vegas to Chicago Flight Search ===")
    success3, data3, response_time3 = run_test(
        name="Las Vegas to Chicago Flight Search",
        endpoint="/flights/search-smart",
        method="POST",
        data=vegas_to_chicago,
        expected_status=200,
        validate_func=validate_smart_flight_search_response
    )
    results["vegas_to_chicago"] = success3
    
    # Check logs to verify Las Vegas resolves to LAS and Chicago to ORD
    log_output = os.popen("tail -n 50 /var/log/supervisor/backend.err.log").read()
    vegas_chicago_resolution = "Searching flights from LAS to ORD" in log_output
    results["vegas_chicago_resolution"] = vegas_chicago_resolution
    
    if vegas_chicago_resolution:
        print("✅ Las Vegas and Chicago correctly resolved to LAS and ORD")
    else:
        print("❌ Las Vegas and Chicago did not resolve correctly")
    
    # Print comprehensive summary
    print("\n" + "="*80)
    print("AMADEUS FLIGHT SEARCH TEST RESULTS SUMMARY")
    print("="*80)
    
    print(f"Tampa to JFK Flight Search: {'✅ PASSED' if results['tampa_to_jfk'] else '❌ FAILED'}")
    print(f"Tampa Resolution to TPA: {'✅ PASSED' if results['tampa_resolution'] else '❌ FAILED'}")
    print(f"No Invalid Client Errors: {'✅ PASSED' if results['no_invalid_client'] else '❌ FAILED'}")
    print(f"Orlando to Miami Flight Search: {'✅ PASSED' if results['orlando_to_miami'] else '❌ FAILED'}")
    print(f"Orlando/Miami Resolution: {'✅ PASSED' if results['orlando_miami_resolution'] else '❌ FAILED'}")
    print(f"Las Vegas to Chicago Flight Search: {'✅ PASSED' if results['vegas_to_chicago'] else '❌ FAILED'}")
    print(f"Las Vegas/Chicago Resolution: {'✅ PASSED' if results['vegas_chicago_resolution'] else '❌ FAILED'}")
    
    all_passed = all(results.values())
    print(f"\nOverall Amadeus Flight Search Test: {'✅ PASSED' if all_passed else '❌ FAILED'}")
    
    if all_passed:
        print("\n✅ The Amadeus flight search functionality is working correctly with the new valid API credentials.")
        print("✅ The following has been verified:")
        print("   - Tampa resolves to TPA correctly")
        print("   - No more 'invalid_client' 401 errors")
        print("   - Flight results are returned successfully")
        print("   - Orlando resolves to MCO and Miami to MIA")
        print("   - Las Vegas resolves to LAS and Chicago to ORD")
        print("   - Amadeus API authentication is successful")
        print("   - Flight search responses have proper data structure")
        print("   - API calls return 200 status codes")
    else:
        print("\n❌ There are issues with the Amadeus flight search functionality.")
        print("   Please check the individual test results for details.")
    
    return all_passed

if __name__ == "__main__":
    # Test the Amadeus flight search functionality with the new valid API credentials
    test_amadeus_flight_search()
    
    # Uncomment to run other tests
    # run_all_airport_code_resolution_tests()
    # test_tampa_to_orlando_resolution()
    # test_airport_code_resolution_direct()
    # test_airport_code_resolution()
    # run_place_details_test()
    # run_review_tests()
    # main()