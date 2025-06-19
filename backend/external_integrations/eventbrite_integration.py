
import os
import requests
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

EVENTBRITE_API_KEY = os.getenv("EVENTBRITE_API_KEY")
EVENTBRITE_API_URL = "https://www.eventbriteapi.com/v3/events/search/"

class EventbriteIntegration:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Eventbrite API key is required.")
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

    def search_events(self, lat: float, lon: float, within: str = "10km", limit: int = 10) -> List[Dict[str, Any]]:
        """Search for events near a given location."""
        params = {
            "location.latitude": lat,
            "location.longitude": lon,
            "location.within": within,
            "expand": "venue",
            "page_size": limit
        }
        try:
            response = requests.get(EVENTBRITE_API_URL, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("events", [])
        except requests.exceptions.RequestException as e:
            print(f"Error searching Eventbrite events: {e}")
            return []

    async def get_local_events(self, lat: float, lon: float, limit: int = 5) -> List[Dict[str, Any]]:
        """Get a list of local events."""
        return self.search_events(lat, lon, limit=limit)

eventbrite_integration = EventbriteIntegration(api_key=EVENTBRITE_API_KEY)
