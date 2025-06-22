import requests
import json
import sys
import os
from dotenv import load_dotenv
from pprint import pprint

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

def test_here_now_plan():
    """Test the Here-Now Plan generation endpoint"""
    print("\n===== Testing Here-Now Plan Generation =====")
    
    url = f"{API_URL}/here-now/plan"
    payload = {
        "location": "New York, NY",
        "mood": "adventurous",
        "budget": "medium",
        "duration_hours": 4
    }
    
    try:
        print(f"Sending request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ Here-Now Plan generation successful!")
            
            # Check location info
            location_info = response_data.get('location_info', {})
            print(f"Location: {location_info.get('formatted_address', 'N/A')}")
            
            # Check weather data
            weather = response_data.get('weather', {})
            print(f"Weather: {weather.get('temperature', 'N/A')}°C, {weather.get('description', 'N/A')}")
            
            # Check AI itinerary
            ai_itinerary = response_data.get('ai_itinerary', {})
            if ai_itinerary:
                activities = ai_itinerary.get('activities', [])
                print(f"AI Itinerary: {len(activities)} activities generated")
                
                if activities:
                    print("\nSample Activity:")
                    sample_activity = activities[0]
                    print(f"  Title: {sample_activity.get('title', 'N/A')}")
                    print(f"  Description: {sample_activity.get('description', 'N/A')[:100]}...")
                    print(f"  Location: {sample_activity.get('location', 'N/A')}")
                    print(f"  Duration: {sample_activity.get('duration_minutes', 'N/A')} minutes")
                    print(f"  Cost: {sample_activity.get('estimated_cost', 'N/A')}")
                
                print(f"\nNarrative Summary: {ai_itinerary.get('narrative_summary', 'N/A')[:100]}...")
                print(f"Total Estimated Cost: {ai_itinerary.get('total_estimated_cost', 'N/A')}")
            else:
                print("❌ AI Itinerary not generated")
                
            # Check nearby places
            nearby_places = response_data.get('nearby_places', [])
            print(f"Nearby Places: {len(nearby_places)} found")
            
            return True
        else:
            print(f"❌ Here-Now Plan generation failed with status code {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Here-Now Plan: {str(e)}")
        return False

def test_ai_generate_itinerary():
    """Test the AI Generate Itinerary endpoint"""
    print("\n===== Testing AI Generate Itinerary Endpoint =====")
    
    url = f"{API_URL}/ai/generate-itinerary"
    payload = {
        "location": "New York, NY",
        "mood": "adventurous",
        "budget": "medium",
        "duration_hours": 4
    }
    
    try:
        print(f"Sending request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ AI Itinerary generation successful!")
            
            # Check itinerary structure
            itinerary = response_data.get('itinerary', {})
            activities = itinerary.get('activities', [])
            
            print(f"Activities: {len(activities)} generated")
            if activities:
                print("\nSample Activity:")
                sample_activity = activities[0]
                print(f"  Title: {sample_activity.get('title', 'N/A')}")
                print(f"  Description: {sample_activity.get('description', 'N/A')[:100]}...")
                print(f"  Location: {sample_activity.get('location', 'N/A')}")
                print(f"  Duration: {sample_activity.get('duration_minutes', 'N/A')} minutes")
                print(f"  Cost: {sample_activity.get('estimated_cost', 'N/A')}")
            
            print(f"\nNarrative Summary: {itinerary.get('narrative_summary', 'N/A')[:100]}...")
            print(f"Total Estimated Cost: {itinerary.get('total_estimated_cost', 'N/A')}")
            
            # Verify required fields are present
            required_fields = ["activities", "narrative_summary", "total_estimated_cost"]
            missing_fields = [field for field in required_fields if field not in itinerary]
            
            if missing_fields:
                print(f"❌ Missing required fields in itinerary: {', '.join(missing_fields)}")
                return False
            
            return True
        else:
            print(f"❌ AI Itinerary generation failed with status code {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing AI Itinerary Generation: {str(e)}")
        return False

def test_ai_generate_journal_recap():
    """Test the AI Generate Journal Recap endpoint"""
    print("\n===== Testing AI Generate Journal Recap Endpoint =====")
    
    url = f"{API_URL}/ai/generate-journal-recap"
    payload = {
        "activities": [
            "Visited Central Park for a morning walk",
            "Had brunch at a local cafe",
            "Explored the Metropolitan Museum of Art",
            "Took a boat ride in the harbor"
        ],
        "location": "New York, NY",
        "date": "2025-05-15"
    }
    
    try:
        print(f"Sending request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ Journal Recap generation successful!")
            
            # Check journal structure
            journal = response_data.get('journal_recap', {})
            
            print(f"Title: {journal.get('title', 'N/A')}")
            print(f"Content: {journal.get('content', 'N/A')[:100]}...")
            print(f"Highlights: {', '.join(journal.get('highlights', ['N/A'])[:2])}")
            print(f"Mood Score: {journal.get('mood_score', 'N/A')}")
            print(f"Shareable Text: {journal.get('shareable_text', 'N/A')}")
            
            # Verify required fields are present
            required_fields = ["title", "content", "highlights", "mood_score", "shareable_text"]
            missing_fields = [field for field in required_fields if field not in journal]
            
            if missing_fields:
                print(f"❌ Missing required fields in journal recap: {', '.join(missing_fields)}")
                return False
            
            return True
        else:
            print(f"❌ Journal Recap generation failed with status code {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data.get('detail', 'No detail provided')}")
            except:
                print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Journal Recap Generation: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and return results"""
    results = {
        "here_now_plan": test_here_now_plan(),
        "ai_generate_itinerary": test_ai_generate_itinerary(),
        "ai_generate_journal_recap": test_ai_generate_journal_recap()
    }
    
    print("\n===== Test Results Summary =====")
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if not result:
            all_passed = False
        print(f"{test_name}: {status}")
    
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)