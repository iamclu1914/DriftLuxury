import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timedelta
import logging

# Construct the absolute path to the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import external integrations
from external_integrations.openai_integration import (
    openai_integration,
    ItineraryResponse,
    JournalRecapResponse
)
from external_integrations.google_places_integration import (
    google_places_integration,
    PlaceDetail,
    LocationInfo
)
from external_integrations.amadeus_integration import (
    amadeus_integration,
    FlightSearchRequest,
    FlightOffer,
    HotelSearchRequest,
    HotelOffer
)
from external_integrations.weather_integration import (
    weather_integration,
    WeatherData,
    WeatherForecast
)
from external_integrations.foursquare_integration import foursquare_integration
from external_integrations.eventbrite_integration import eventbrite_integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DRIFT Travel API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "drift_travel")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic models
class StatusCheck(BaseModel):
    id: str
    status: str
    timestamp: datetime
    message: Optional[str] = None

class HereNowRequest(BaseModel):
    location: str
    mood: str
    budget: str
    duration_hours: int = 4

class TripPlanRequest(BaseModel):
    destination: str
    departure_date: str
    return_date: str
    budget: float
    travelers: Dict[str, int]
    preferences: Dict[str, Any]

# Status endpoints
@app.get("/api/status")
async def get_status():
    try:
        # Test database connection
        await db.list_collection_names()
        return {"status": "healthy", "timestamp": datetime.now(), "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unavailable")

@app.post("/api/status")
async def create_status_check(status_data: StatusCheck):
    try:
        # Create status check document
        status_doc = {
            "id": str(uuid.uuid4()),
            "status": status_data.status,
            "timestamp": datetime.now(),
            "message": status_data.message
        }
        
        result = await db.status_checks.insert_one(status_doc)
        return {"success": True, "id": status_doc["id"]}
    except Exception as e:
        logger.error(f"Failed to create status check: {e}")
        raise HTTPException(status_code=500, detail="Failed to create status check")

# Weather endpoints
@app.get("/api/weather/current")
async def get_current_weather(lat: float, lon: float):
    try:
        weather_data = await weather_integration.get_current_weather(lat, lon)
        return {"success": True, "weather": weather_data}
    except Exception as e:
        logger.error(f"Weather fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Weather fetch failed: {str(e)}")

@app.get("/api/weather/forecast")
async def get_weather_forecast(lat: float, lon: float, days: int = 5):
    try:
        forecast_data = await weather_integration.get_weather_forecast(lat, lon, days)
        return {"success": True, "forecast": forecast_data}
    except Exception as e:
        logger.error(f"Forecast fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast fetch failed: {str(e)}")

# AI endpoints
@app.post("/api/ai/generate-itinerary")
async def generate_itinerary(request: Dict[str, Any]):
    try:
        location = request.get('location')
        mood = request.get('mood', 'adventurous')
        budget = request.get('budget', 'medium')
        duration_hours = request.get('duration_hours', 4)
        
        if not location:
            raise HTTPException(status_code=400, detail="Location is required")
        
        itinerary = await openai_integration.generate_itinerary(
            location=location,
            mood=mood,
            budget=budget,
            duration_hours=duration_hours
        )
        
        return {"success": True, "itinerary": itinerary}
    except Exception as e:
        logger.error(f"Itinerary generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Itinerary generation failed: {str(e)}")

@app.post("/api/ai/generate-journal-recap")
async def generate_journal_recap(request: Dict[str, Any]):
    try:
        activities = request.get('activities', [])
        location = request.get('location')
        date = request.get('date')
        
        if not activities:
            raise HTTPException(status_code=400, detail="Activities are required")
        
        journal_recap = await openai_integration.generate_journal_recap(
            activities=activities,
            location=location,
            date=date
        )
        
        return {"success": True, "journal_recap": journal_recap}
    except Exception as e:
        logger.error(f"Journal recap generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Journal recap generation failed: {str(e)}")

# Places endpoints
@app.post("/api/places/search")
async def search_places(request: Dict[str, Any]):
    try:
        query = request.get('query')
        location = request.get('location')
        radius = request.get('radius', 1000)
        place_type = request.get('type', 'point_of_interest')
        
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
        
        places = await google_places_integration.search_places(
            query=query,
            location=location,
            radius=radius,
            place_type=place_type
        )
        
        return {"success": True, "places": places, "count": len(places)}
    except Exception as e:
        logger.error(f"Places search error: {e}")
        raise HTTPException(status_code=500, detail=f"Places search failed: {str(e)}")


# Location Search Endpoints (Amadeus)
@app.get("/api/locations/airports", summary="Search for airports by keyword", tags=["Locations"])
async def get_airports_by_keyword(keyword: str):
    """
    Search for airports using the Amadeus API based on a keyword.
    Requires AMADEUS_API_KEY and AMADEUS_API_SECRET to be set for the Amadeus client.
    """
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword query parameter is required.")
    try:
        # amadeus_integration is already imported and should be instantiated in amadeus_integration.py
        airports_data = await amadeus_integration.search_airports(keyword=keyword)
        # amadeus_integration.search_airports typically returns an empty list on API error or no results.
        return {"success": True, "airports": airports_data, "count": len(airports_data)}
    except Exception as e:
        # This catches errors if amadeus_integration itself is not initialized (e.g. missing keys at startup)
        # or other unexpected issues not caught within search_airports.
        logger.error(f"Error in /api/locations/airports for keyword '{keyword}': {str(e)}")
        detail_msg = "Failed to search airports. Check server logs and Amadeus API key configuration."
        status_code = 500
        if "AMADEUS_API_KEY" in str(e) or "AMADEUS_API_SECRET" in str(e) or "credentials" in str(e).lower():
            detail_msg = "Amadeus client error. Ensure API keys are correctly configured in backend .env."
            status_code = 503 # Service Unavailable, often due to config/auth issues
        raise HTTPException(status_code=status_code, detail=detail_msg)

@app.get("/api/locations/cities", summary="Search for cities by keyword", tags=["Locations"])
async def get_cities_by_keyword(keyword: str):
    """
    Search for cities using the Amadeus API based on a keyword.
    Requires AMADEUS_API_KEY and AMADEUS_API_SECRET to be set for the Amadeus client.
    """
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword query parameter is required.")
    try:
        cities_data = await amadeus_integration.search_cities(keyword=keyword)
        return {"success": True, "cities": cities_data, "count": len(cities_data)}
    except Exception as e:
        logger.error(f"Error in /api/locations/cities for keyword '{keyword}': {str(e)}")
        detail_msg = "Failed to search cities. Check server logs and Amadeus API key configuration."
        status_code = 500
        if "AMADEUS_API_KEY" in str(e) or "AMADEUS_API_SECRET" in str(e) or "credentials" in str(e).lower():
            detail_msg = "Amadeus client error. Ensure API keys are correctly configured in backend .env."
            status_code = 503
        raise HTTPException(status_code=status_code, detail=detail_msg)


@app.get("/api/places/details")
async def get_place_details(place_id: str):
    try:
        place_details = await google_places_integration.get_place_details(place_id)
        return {"success": True, "place": place_details}
    except Exception as e:
        logger.error(f"Place details error: {e}")
        raise HTTPException(status_code=500, detail=f"Place details failed: {str(e)}")

@app.post("/api/places/nearby")
async def get_nearby_places(request: Dict[str, Any]):
    try:
        latitude = request.get('latitude')
        longitude = request.get('longitude')
        radius = request.get('radius', 1000)
        place_type = request.get('type', 'point_of_interest')
        
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude are required")
        
        places = await google_places_integration.get_nearby_places(
            latitude=latitude,
            longitude=longitude,
            radius=radius,
            place_type=place_type
        )
        
        return {"success": True, "places": places, "count": len(places)}
    except Exception as e:
        logger.error(f"Nearby places error: {e}")
        raise HTTPException(status_code=500, detail=f"Nearby places failed: {str(e)}")

@app.post("/api/places/geocode")
async def geocode_location(request: Dict[str, Any]):
    try:
        address = request.get('address')
        
        if not address:
            raise HTTPException(status_code=400, detail="Address is required")
        
        location_info = await google_places_integration.geocode_location(address)
        return {"success": True, "location": location_info}
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")

# Flight search endpoints
@app.post("/api/flights/search-smart")
async def search_smart_flights(request: Dict[str, Any]):
    """
    Enhanced flight search with smart features like sustainability, budget intelligence, etc.
    """
    try:
        # Extract search data and smart features
        search_data = {
            'origin': request.get('origin'),
            'destination': request.get('destination'),
            'departure_date': request.get('departureDate'),
            'return_date': request.get('returnDate'),
            'adults': request.get('adults', 1),
            'travel_class': request.get('travelClass', 'ECONOMY'),
            'max_results': 8
        }
        
        smart_features = request.get('smart_features', {})
        budget_context = request.get('budget_context')
        
        # Create flight search request
        flight_request = FlightSearchRequest(**search_data)
        
        # Get flight results
        flights = await amadeus_integration.search_flights(flight_request)
        
        # Add smart enhancements
        enhanced_flights = []
        for flight in flights:
            enhanced_flight = flight.dict()
            
            # Add sustainability score if enabled
            if smart_features.get('sustainabilityMode'):
                enhanced_flight['sustainability_score'] = calculate_sustainability_score(flight)
            
            # Add budget fit analysis if enabled
            if smart_features.get('budgetIntelligence') and budget_context:
                enhanced_flight['budget_fit'] = analyze_budget_fit(flight, budget_context)
            
            enhanced_flights.append(enhanced_flight)
        
        # Generate smart recommendations
        recommendations = []
        if smart_features.get('moodBasedSuggestions'):
            recommendations = generate_flight_recommendations(enhanced_flights, smart_features)
        
        # Calculate carbon footprint data
        carbon_data = None
        
        # Calculate overall carbon data if sustainability is enabled
        if smart_features.get('sustainabilityMode'):
            carbon_data = calculate_trip_carbon_impact(enhanced_flights)
        
        return {
            "success": True,
            "flights": enhanced_flights,
            "carbon_data": carbon_data,
            "recommendations": recommendations,
            "smart_features_applied": smart_features
        }
        
    except Exception as e:
        logger.error(f"Smart flight search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Smart flight search failed: {str(e)}")

@app.post("/api/flights/search")
async def search_flights(request: FlightSearchRequest):
    try:
        flights = await amadeus_integration.search_flights(request)
        return {"success": True, "flights": flights}
    except Exception as e:
        logger.error(f"Flight search error: {e}")
        raise HTTPException(status_code=500, detail=f"Flight search failed: {str(e)}")

@app.post("/api/flights/flexible-search")
async def flexible_flight_search(request: Dict[str, Any]):
    try:
        origin = request.get('origin')
        destination = request.get('destination')
        departure_date = request.get('departure_date')
        return_date = request.get('return_date')
        adults = request.get('adults', 1)
        
        flights = await amadeus_integration.flexible_flight_search(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            adults=adults
        )
        
        return {"success": True, "flights": flights}
    except Exception as e:
        logger.error(f"Flexible flight search error: {e}")
        raise HTTPException(status_code=500, detail=f"Flexible flight search failed: {str(e)}")

# Hotel search endpoints
@app.post("/api/hotels/search")
async def search_hotels(request: Dict[str, Any]):
    try:
        location = request.get('location')
        check_in = request.get('check_in')
        check_out = request.get('check_out')
        guests = request.get('guests', 1)
        
        hotel_request = HotelSearchRequest(
            location=location,
            check_in=check_in,
            check_out=check_out,
            guests=guests
        )
        
        hotels = await amadeus_integration.search_hotels(hotel_request)
        return {"success": True, "hotels": hotels}
    except Exception as e:
        logger.error(f"Hotel search error: {e}")
        raise HTTPException(status_code=500, detail=f"Hotel search failed: {str(e)}")

# Airport and city search endpoints
@app.get("/api/amadeus/search-airports")
async def search_airports(keyword: str):
    try:
        airports = await amadeus_integration.search_airports(keyword)
        return {"success": True, "airports": airports}
    except Exception as e:
        logger.error(f"Airport search error: {e}")
        raise HTTPException(status_code=500, detail=f"Airport search failed: {str(e)}")

@app.get("/api/amadeus/search-cities")
async def search_cities(keyword: str):
    try:
        cities = await amadeus_integration.search_cities(keyword)
        return {"success": True, "cities": cities}
    except Exception as e:
        logger.error(f"City search error: {e}")
        raise HTTPException(status_code=500, detail=f"City search failed: {str(e)}")

# Here-Now planning endpoint
@app.post("/api/here-now/plan")
async def create_here_now_plan(request: HereNowRequest):
    try:
        # Step 1: Get location coordinates
        location_info = await google_places_integration.geocode_location(request.location)
        lat = location_info.coordinates['lat']
        lon = location_info.coordinates['lng']
        # Step 2: Get current weather
        weather_data = await weather_integration.get_current_weather(lat, lon)
        # Step 3: Get data for each category using exact coordinates
        dining = await foursquare_integration.get_restaurants_with_photos(lat, lon, limit=5)
        events = await eventbrite_integration.get_local_events(lat, lon, limit=5)
        attractions = await google_places_integration.get_nearby_places(lat, lon, place_type='tourist_attraction', radius=5000)
        fun = await google_places_integration.get_nearby_places(lat, lon, place_type='amusement_park', radius=5000)

        # Step 4: Generate an overview with OpenAI
        overview_prompt = f"Create a short, exciting overview for a {request.duration_hours}-hour trip in {request.location} with a {request.mood} mood and a {request.budget} budget. The weather is {weather_data.description} at {weather_data.temperature}°F."
        overview = await openai_integration.generate_itinerary(
            location=request.location,
            mood=request.mood,
            budget=request.budget,
            duration_hours=request.duration_hours,
            real_venues=overview_prompt
        )

        # Step 5: Structure the itinerary
        structured_itinerary = {
            "overview": overview,
            "dining": dining,
            "events": events,
            "attractions": attractions,
            "fun": fun
        }
        
        return {
            "success": True,
            "location_info": location_info,
            "weather": weather_data,
            "itinerary": structured_itinerary
        }
        
    except Exception as e:
        logger.error(f"Here-now plan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create here-now plan: {str(e)}")

# Trip planning endpoint
@app.post("/api/trip/plan-and-book")
async def plan_and_book_trip(request: TripPlanRequest):
    try:
        # 1) Destination details
        destination_info = await google_places_integration.geocode_location(request.destination)

        # 2) Nearby places (once for entire trip)
        places = await google_places_integration.get_nearby_places(
            latitude=destination_info.coordinates['lat'],
            longitude=destination_info.coordinates['lng'],
            radius=5000
        )

        # 3) Create day-by-day itineraries with OpenAI
        start_dt = datetime.strptime(request.departure_date, "%Y-%m-%d")
        end_dt = datetime.strptime(request.return_date or request.departure_date, "%Y-%m-%d")
        trip_days = (end_dt - start_dt).days + 1

        itineraries = []
        for day_offset in range(trip_days):
            current_date = start_dt + timedelta(days=day_offset)
            try:
                day_itinerary = await openai_integration.generate_itinerary(
                    location=request.destination,
                    mood=request.preferences.get("mood", "adventurous"),
                    budget=request.preferences.get("budget", "medium"),
                    duration_hours=12  # assume 12hr of activities per day
                )
            except Exception as e:
                logger.warning(f"OpenAI itinerary generation failed for day {day_offset+1}: {e}")
                day_itinerary = None

            itineraries.append({
                "day": day_offset + 1,
                "date": current_date.strftime("%Y-%m-%d"),
                "itinerary": day_itinerary
            })

        # 4) Flights – origin required
        flights = []
        origin = request.preferences.get("origin")
        if origin:
            try:
                flight_request = FlightSearchRequest(
                    origin=origin,
                    destination=request.destination,
                    departure_date=request.departure_date,
                    return_date=request.return_date,
                    adults=request.travelers.get("adults", 1)
                )
                flights = await amadeus_integration.search_flights(flight_request)
            except Exception as e:
                logger.warning(f"Flight search failed in trip planning: {e}")

        # 5) Hotels (optional)
        hotels = []
        try:
            hotel_request = HotelSearchRequest(
                location=request.destination,
                check_in=request.departure_date,
                check_out=request.return_date,
                guests=request.travelers.get("adults", 1)
            )
            hotels = await amadeus_integration.search_hotels(hotel_request)
        except Exception as e:
            logger.warning(f"Hotel search failed in trip planning: {e}")

        return {
            "success": True,
            "itineraries": itineraries,
            # keep original key for backward-compat
            "itinerary": itineraries[0]["itinerary"] if itineraries else None,
            "places": places,
            "flights": flights,
            "hotels": hotels,
            "destination_info": destination_info,
            "summary": {
                "total_cost": f"${request.budget:.0f}",
                "duration": f"{trip_days} day{'s' if trip_days>1 else ''}",
                "activities_count": sum(len(d['itinerary'].activities) for d in itineraries if d.get('itinerary') and hasattr(d['itinerary'], 'activities'))
            }
        }
        
    except Exception as e:
        logger.error(f"Trip planning error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trip planning failed: {str(e)}")

# Helper functions
def calculate_sustainability_score(flight):
    """Calculate sustainability score based on flight characteristics"""
    base_score = 70
    
    # Adjust based on number of stops
    if hasattr(flight, 'itineraries'):
        for itinerary in flight.itineraries:
            if hasattr(itinerary, 'segments') and len(itinerary.segments) > 1:
                base_score -= 10  # Penalty for connections
    
    return min(100, max(0, base_score))

def analyze_budget_fit(flight, budget_context):
    """Analyze how well flight fits within budget"""
    if not hasattr(flight, 'price') or not flight.price:
        return "unknown"
    
    price = float(flight.price.total) if hasattr(flight.price, 'total') else 0
    budget = float(budget_context.get('total', 1000))
    
    ratio = price / budget if budget > 0 else 1
    
    if ratio <= 0.3:
        return "excellent"
    elif ratio <= 0.5:
        return "good"
    elif ratio <= 0.7:
        return "fair"
    else:
        return "over-budget"

def generate_flight_recommendations(flights, smart_features):
    """Generate smart recommendations based on flights and preferences"""
    recommendations = []
    
    if not flights:
        return recommendations
    
    # Find best value flight
    if smart_features.get('budgetIntelligence'):
        recommendations.append({
            "type": "best_value",
            "title": "Best Value Option",
            "description": "Great balance of price and convenience"
        })
    
    # Find most sustainable option
    if smart_features.get('sustainabilityMode'):
        recommendations.append({
            "type": "eco_friendly",
            "title": "Most Eco-Friendly",
            "description": "Lowest carbon footprint option"
        })
    
    return recommendations

def calculate_trip_carbon_impact(flights):
    """Calculate estimated carbon impact for the trip"""
    if not flights:
        return None
    
    # Simplified carbon calculation
    base_emissions = 0.5  # kg CO2 per km (rough estimate)
    
    return {
        "total_kg_co2": len(flights) * 500,  # Simplified calculation
        "comparison": "20% less than average",
        "offset_cost": "$25"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
