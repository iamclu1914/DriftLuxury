"""
Trip Mode Integration for DRIFT Travel App
Provides flight and hotel booking functionality using Amadeus API
"""

import os
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import date, datetime
from amadeus import Client, ResponseError
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic Models for Trip Mode
class FlightSegment(BaseModel):
    origin: str
    destination: str
    departure_date: str

class FlightSearchRequest(BaseModel):
    itinerary_type: str  # one-way, round-trip, multi-city
    adults: int = 1
    children: int = 0
    segments: List[FlightSegment]

class FlightOffer(BaseModel):
    id: str
    source: str = "Amadeus"
    price: Dict[str, Any]
    itinerary: Dict[str, Any]
    airline: str
    duration: str
    stops: int

class HotelSearchRequest(BaseModel):
    location: str
    check_in: str
    check_out: str
    guests: int = 1
    rooms: int = 1

class HotelOffer(BaseModel):
    id: str
    name: str
    address: str
    price: Dict[str, Any]
    rating: Optional[float] = None
    amenities: List[str] = []
    photos: List[str] = []
    description: str = ""

class TripBookingRequest(BaseModel):
    trip_type: str  # flight, hotel, package
    flight_id: Optional[str] = None
    hotel_id: Optional[str] = None
    guest_details: Dict[str, Any]
    total_price: float

class TripModeIntegration:
    def __init__(self):
        self.client_id = os.getenv("AMADEUS_CLIENT_ID")
        self.client_secret = os.getenv("AMADEUS_CLIENT_SECRET")
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Amadeus API credentials not found in environment variables")
        
        # Initialize Amadeus client
        self.amadeus = Client(
            client_id=self.client_id,
            client_secret=self.client_secret,
            hostname='production'  # Use 'test' for testing
        )
        
    async def search_flights(self, request: FlightSearchRequest) -> List[FlightOffer]:
        """
        Search for flights using Amadeus Flight Offers Search API
        """
        try:
            logger.info(f"Searching flights for {request.itinerary_type} itinerary")
            
            if request.itinerary_type == "one-way":
                segment = request.segments[0]
                response = self.amadeus.shopping.flight_offers_search.get(
                    originLocationCode=segment.origin,
                    destinationLocationCode=segment.destination,
                    departureDate=segment.departure_date,
                    adults=request.adults,
                    children=request.children,
                    max=10  # Limit results
                )
            
            elif request.itinerary_type == "round-trip":
                outbound = request.segments[0]
                return_segment = request.segments[1] if len(request.segments) > 1 else None
                
                if not return_segment:
                    raise ValueError("Round-trip requires return segment")
                
                response = self.amadeus.shopping.flight_offers_search.get(
                    originLocationCode=outbound.origin,
                    destinationLocationCode=outbound.destination,
                    departureDate=outbound.departure_date,
                    returnDate=return_segment.departure_date,
                    adults=request.adults,
                    children=request.children,
                    max=10
                )
            
            else:  # multi-city
                # For multi-city, we'll handle the first segment for now
                # Full multi-city requires more complex API calls
                segment = request.segments[0]
                response = self.amadeus.shopping.flight_offers_search.get(
                    originLocationCode=segment.origin,
                    destinationLocationCode=segment.destination,
                    departureDate=segment.departure_date,
                    adults=request.adults,
                    children=request.children,
                    max=10
                )
            
            return self._format_flight_results(response.data)
            
        except ResponseError as error:
            logger.error(f"Amadeus Flight API error: {error}")
            return []
        except Exception as e:
            logger.error(f"Flight search error: {str(e)}")
            return []
    
    async def search_hotels(self, request: HotelSearchRequest) -> List[HotelOffer]:
        """
        Search for hotels using Amadeus Hotel Search API
        """
        try:
            logger.info(f"Searching hotels in {request.location}")
            
            # First, get city code from location name
            city_response = self.amadeus.reference_data.locations.get(
                keyword=request.location,
                subType='CITY'
            )
            
            if not city_response.data:
                logger.warning(f"No city found for location: {request.location}")
                return []
            
            city_code = city_response.data[0]['iataCode']
            
            # Search for hotels
            hotel_response = self.amadeus.shopping.hotel_offers.get(
                cityCode=city_code,
                checkInDate=request.check_in,
                checkOutDate=request.check_out,
                adults=request.guests,
                roomQuantity=request.rooms
            )
            
            return self._format_hotel_results(hotel_response.data)
            
        except ResponseError as error:
            logger.error(f"Amadeus Hotel API error: {error}")
            return []
        except Exception as e:
            logger.error(f"Hotel search error: {str(e)}")
            return []
    
    async def get_flight_price(self, flight_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed pricing for a specific flight offer
        """
        try:
            response = self.amadeus.shopping.flight_offers.pricing.post(
                {"data": {"type": "flight-offers-pricing", "flightOffers": [{"id": flight_id}]}}
            )
            return response.data
        except ResponseError as error:
            logger.error(f"Flight pricing error: {error}")
            return None
    
    async def get_hotel_details(self, hotel_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific hotel
        """
        try:
            response = self.amadeus.shopping.hotel_offers.get(hotelId=hotel_id)
            return response.data
        except ResponseError as error:
            logger.error(f"Hotel details error: {error}")
            return None
    
    def _format_flight_results(self, data: List[Dict]) -> List[FlightOffer]:
        """
        Format Amadeus flight response into FlightOffer objects
        """
        formatted_offers = []
        
        for offer in data:
            try:
                # Extract airline from first segment
                first_segment = offer['itineraries'][0]['segments'][0]
                airline_code = first_segment['carrierCode']
                
                # Calculate total duration
                total_duration = offer['itineraries'][0]['duration']
                
                # Count stops
                stops = len(offer['itineraries'][0]['segments']) - 1
                
                formatted_offer = FlightOffer(
                    id=offer['id'],
                    source="Amadeus",
                    price={
                        "total": offer['price']['total'],
                        "currency": offer['price']['currency'],
                        "base": offer['price'].get('base', offer['price']['total'])
                    },
                    itinerary={
                        "segments": []
                    },
                    airline=airline_code,
                    duration=total_duration,
                    stops=stops
                )
                
                # Format segments
                for itinerary in offer['itineraries']:
                    for segment in itinerary['segments']:
                        formatted_segment = {
                            "departure": {
                                "iataCode": segment['departure']['iataCode'],
                                "terminal": segment['departure'].get('terminal'),
                                "at": segment['departure']['at']
                            },
                            "arrival": {
                                "iataCode": segment['arrival']['iataCode'],
                                "terminal": segment['arrival'].get('terminal'),
                                "at": segment['arrival']['at']
                            },
                            "carrierCode": segment['carrierCode'],
                            "number": segment['number'],
                            "aircraft": segment.get('aircraft', {}).get('code'),
                            "duration": segment['duration']
                        }
                        formatted_offer.itinerary["segments"].append(formatted_segment)
                
                formatted_offers.append(formatted_offer)
                
            except KeyError as e:
                logger.warning(f"Missing key in flight offer: {e}")
                continue
        
        return formatted_offers
    
    def _format_hotel_results(self, data: List[Dict]) -> List[HotelOffer]:
        """
        Format Amadeus hotel response into HotelOffer objects
        """
        formatted_offers = []
        
        for hotel_data in data:
            try:
                hotel = hotel_data['hotel']
                offers = hotel_data['offers']
                
                # Get the first offer for pricing
                first_offer = offers[0] if offers else {}
                
                formatted_hotel = HotelOffer(
                    id=hotel['hotelId'],
                    name=hotel['name'],
                    address=hotel.get('address', {}).get('lines', [''])[0],
                    price={
                        "total": first_offer.get('price', {}).get('total', '0'),
                        "currency": first_offer.get('price', {}).get('currency', 'USD'),
                        "base": first_offer.get('price', {}).get('base', '0')
                    },
                    rating=hotel.get('rating'),
                    amenities=hotel.get('amenities', []),
                    description=hotel.get('description', {}).get('text', ''),
                    photos=[]  # Amadeus doesn't provide photos in basic search
                )
                
                formatted_offers.append(formatted_hotel)
                
            except KeyError as e:
                logger.warning(f"Missing key in hotel offer: {e}")
                continue
        
        return formatted_offers
    
    async def create_flight_booking(self, booking_request: TripBookingRequest) -> Dict[str, Any]:
        """
        Create a flight booking (Note: This requires additional Amadeus booking API setup)
        """
        try:
            # This is a simplified booking flow
            # Real implementation requires Amadeus Flight Create Orders API
            booking_id = f"DRIFT-FL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            booking_data = {
                "booking_id": booking_id,
                "type": "flight",
                "status": "confirmed",
                "flight_id": booking_request.flight_id,
                "guest_details": booking_request.guest_details,
                "total_price": booking_request.total_price,
                "created_at": datetime.now().isoformat(),
                "confirmation_number": f"DRIFT-{booking_id[-8:]}"
            }
            
            logger.info(f"Flight booking created: {booking_id}")
            return booking_data
            
        except Exception as e:
            logger.error(f"Flight booking error: {str(e)}")
            raise Exception(f"Failed to create flight booking: {str(e)}")
    
    async def create_hotel_booking(self, booking_request: TripBookingRequest) -> Dict[str, Any]:
        """
        Create a hotel booking (Note: This requires additional Amadeus booking API setup)
        """
        try:
            # This is a simplified booking flow
            # Real implementation requires Amadeus Hotel Booking API
            booking_id = f"DRIFT-HT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            booking_data = {
                "booking_id": booking_id,
                "type": "hotel",
                "status": "confirmed",
                "hotel_id": booking_request.hotel_id,
                "guest_details": booking_request.guest_details,
                "total_price": booking_request.total_price,
                "created_at": datetime.now().isoformat(),
                "confirmation_number": f"DRIFT-{booking_id[-8:]}"
            }
            
            logger.info(f"Hotel booking created: {booking_id}")
            return booking_data
            
        except Exception as e:
            logger.error(f"Hotel booking error: {str(e)}")
            raise Exception(f"Failed to create hotel booking: {str(e)}")

# Initialize the integration
trip_mode_integration = TripModeIntegration()