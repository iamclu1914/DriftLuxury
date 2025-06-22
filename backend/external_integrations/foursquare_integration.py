import os
import requests
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")
FOURSQUARE_API_URL = "https://api.foursquare.com/v3/places/search"

class FoursquareIntegration:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Foursquare API key is required.")
        self.api_key = api_key
        self.headers = {
            "Authorization": self.api_key,
            "accept": "application/json"
        }

    def search_venues(self, lat: float, lon: float, category: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for venues near a given location."""
        params = {
            "ll": f"{lat},{lon}",
            "categories": category,
            "limit": limit,
            "fields": "fsq_id,name,location,categories,rating,price,photos"
        }
        try:
            response = requests.get(FOURSQUARE_API_URL, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except requests.exceptions.RequestException as e:
            print(f"Error searching Foursquare venues: {e}")
            return []

    def get_venue_photos(self, fsq_id: str) -> List[str]:
        """Get photo URLs for a specific venue."""
        photo_urls = []
        photo_api_url = f"https://api.foursquare.com/v3/places/{fsq_id}/photos"
        try:
            response = requests.get(photo_api_url, headers=self.headers)
            response.raise_for_status()
            photos_data = response.json()
            for photo in photos_data:
                prefix = photo.get("prefix")
                suffix = photo.get("suffix")
                if prefix and suffix:
                    photo_urls.append(f"{prefix}original{suffix}")
            return photo_urls
        except requests.exceptions.RequestException as e:
            print(f"Error getting venue photos for {fsq_id}: {e}")
            return []

    async def get_restaurants_with_photos(self, lat: float, lon: float, limit: int = 5) -> List[Dict[str, Any]]:
        """Get a list of restaurants with their photos."""
        restaurants = self.search_venues(lat, lon, category="13065", limit=limit) # 13065 is the category for "Restaurant"
        for restaurant in restaurants:
            fsq_id = restaurant.get("fsq_id")
            photos = self.get_venue_photos(fsq_id) if fsq_id else []
            # Use the first photo if available, else fallback
            restaurant["photo_url"] = photos[0] if photos else "https://via.placeholder.com/300x200?text=No+Image"
        return restaurants

foursquare_integration = FoursquareIntegration(api_key=FOURSQUARE_API_KEY)
