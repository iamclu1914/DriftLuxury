import googlemaps
import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import random

logger = logging.getLogger(__name__)

# Pydantic models
class PlaceDetail(BaseModel):
    place_id: str
    name: str
    rating: Optional[float] = None
    price_level: Optional[int] = None
    types: List[str] = []
    formatted_address: Optional[str] = None
    vicinity: Optional[str] = None
    opening_hours: Optional[Dict[str, Any]] = None
    photos: Optional[List[Dict[str, Any]]] = None
    geometry: Optional[Dict[str, Any]] = None
    website: Optional[str] = None
    formatted_phone_number: Optional[str] = None
    user_ratings_total: Optional[int] = None
    reviews: Optional[List[Dict[str, Any]]] = None
    cost_estimate: Optional[str] = None  # Add cost estimate field

class LocationInfo(BaseModel):
    formatted_address: str
    coordinates: Dict[str, float]
    place_id: Optional[str] = None
    types: List[str] = []

class GooglePlacesIntegration:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")
        self.client = googlemaps.Client(key=self.api_key)

    async def geocode_location(self, address: str) -> LocationInfo:
        """Convert address to coordinates and location info"""
        try:
            geocode_result = self.client.geocode(address)
            if not geocode_result:
                raise Exception(f"No location found for: {address}")
            
            result = geocode_result[0]
            location = result['geometry']['location']
            
            return LocationInfo(
                formatted_address=result['formatted_address'],
                coordinates={'lat': location['lat'], 'lng': location['lng']},
                place_id=result.get('place_id'),
                types=result.get('types', [])
            )
        except Exception as e:
            logger.error(f"Geocoding error for {address}: {e}")
            raise Exception(f"Failed to geocode location: {address}")

    async def search_places(
        self,
        query: str,
        location: str = None,
        radius: int = 1000,
        place_type: str = None
    ) -> List[PlaceDetail]:
        """Search for places based on query"""
        try:
            # If location is provided, get coordinates first
            location_coords = None
            if location:
                try:
                    location_info = await self.geocode_location(location)
                    location_coords = f"{location_info.coordinates['lat']},{location_info.coordinates['lng']}"
                except:
                    pass  # Continue without location bias
            
            # Search for places
            places_result = self.client.places(
                query=query,
                location=location_coords,
                radius=radius,
                type=place_type
            )
            
            places = []
            for place in places_result.get('results', []):
                place_detail = self._convert_to_place_detail(place)
                places.append(place_detail)
            
            return places
            
        except Exception as e:
            logger.error(f"Places search error: {e}")
            return []

    async def get_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1000,
        place_type: str = "point_of_interest"
    ) -> List[PlaceDetail]:
        """Get nearby places around coordinates"""
        try:
            location = f"{latitude},{longitude}"
            
            # Get nearby places
            places_result = self.client.places_nearby(
                location=location,
                radius=radius,
                type=place_type
            )
            
            places = []
            for place in places_result.get('results', []):
                place_detail = self._convert_to_place_detail(place)
                places.append(place_detail)
            
            # Sort by rating (if available) and limit results
            places.sort(key=lambda x: x.rating or 0, reverse=True)
            return places[:20]  # Return top 20 places
            
        except Exception as e:
            logger.error(f"Nearby places error: {e}")
            return []

    async def get_place_details(self, place_id: str) -> PlaceDetail:
        """Get detailed information about a specific place"""
        try:
            place_result = self.client.place(
                place_id=place_id,
                fields=[
                    'place_id', 'name', 'rating', 'price_level', 'type',
                    'formatted_address', 'vicinity', 'opening_hours',
                    'photo', 'geometry', 'website', 'formatted_phone_number',
                    'user_ratings_total', 'review'
                ]
            )
            
            place_data = place_result.get('result', {})
            place_detail = self._convert_to_place_detail(place_data, include_details=True)
            
            return place_detail
            
        except Exception as e:
            logger.error(f"Place details error: {e}")
            raise Exception(f"Failed to get place details for: {place_id}")

    def _convert_to_place_detail(self, place_data: Dict[str, Any], include_details: bool = False) -> PlaceDetail:
        """Convert Google Places API result to PlaceDetail model"""
        # Estimate cost based on price_level and place types
        types = place_data.get('types', [])
        if 'type' in place_data:
            # Handle singular 'type' field from place details API
            types = place_data.get('type', [])
        
        cost_estimate = self._estimate_cost(place_data.get('price_level'), types)
        
        # Process photos
        photos = []
        if 'photos' in place_data and place_data['photos']:
            for photo in place_data['photos'][:1]:  # Use the first photo for main image
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={self.api_key}"
                photos.append({
                    'photo_reference': photo['photo_reference'],
                    'url': photo_url,
                    'width': photo.get('width'),
                    'height': photo.get('height'),
                    'html_attributions': photo.get('html_attributions', [])
                })
        # Fallback if no photo
        if not photos:
            photos = [{
                'url': 'https://via.placeholder.com/300x200?text=No+Image',
                'photo_reference': None,
                'width': 300,
                'height': 200,
                'html_attributions': []
            }]
        
        # Handle reviews (both 'reviews' from search and 'review' from place details)
        reviews = place_data.get('reviews', []) or place_data.get('review', [])
        
        return PlaceDetail(
            place_id=place_data.get('place_id', ''),
            name=place_data.get('name', 'Unknown Place'),
            rating=place_data.get('rating'),
            price_level=place_data.get('price_level'),
            types=types,
            formatted_address=place_data.get('formatted_address'),
            vicinity=place_data.get('vicinity'),
            opening_hours=place_data.get('opening_hours'),
            photos=photos if photos else None,
            geometry=place_data.get('geometry'),
            website=place_data.get('website'),
            formatted_phone_number=place_data.get('formatted_phone_number'),
            user_ratings_total=place_data.get('user_ratings_total'),
            reviews=reviews,
            cost_estimate=cost_estimate
        )

    def _estimate_cost(self, price_level: Optional[int], place_types: List[str]) -> str:
        """Estimate cost category based on price level and place types"""
        if price_level is not None:
            if price_level == 0:
                return "Free"
            elif price_level == 1:
                return "$"
            elif price_level == 2:
                return "$$"
            elif price_level == 3:
                return "$$$"
            elif price_level >= 4:
                return "$$$$"
        
        # Fallback estimation based on place types
        expensive_types = ['casino', 'spa', 'night_club', 'fine_dining']
        moderate_types = ['restaurant', 'shopping_mall', 'movie_theater']
        cheap_types = ['park', 'museum', 'library', 'church']
        
        for place_type in place_types:
            if any(exp_type in place_type.lower() for exp_type in expensive_types):
                return "$$$"
            elif any(mod_type in place_type.lower() for mod_type in moderate_types):
                return "$$"
            elif any(cheap_type in place_type.lower() for cheap_type in cheap_types):
                return "$"
        
        return "$$"  # Default moderate cost

# Create a singleton instance
google_places_integration = GooglePlacesIntegration()
