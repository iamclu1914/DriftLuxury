import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
from amadeus import Client, ResponseError

logger = logging.getLogger(__name__)

# Pydantic models
class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: Optional[str] = None
    adults: int = 1
    children: int = 0
    travel_class: str = "ECONOMY"
    max_results: int = 10

class FlightOffer(BaseModel):
    id: Optional[str] = None
    source: Optional[str] = None
    price: Optional[Dict[str, Any]] = None
    itineraries: Optional[List[Dict[str, Any]]] = None
    travelerPricings: Optional[List[Dict[str, Any]]] = None
    validatingAirlineCodes: Optional[List[str]] = None

class HotelSearchRequest(BaseModel):
    location: str
    check_in: str
    check_out: str
    guests: int = 1
    rooms: int = 1

class HotelOffer(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    rating: Optional[float] = None
    price: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    amenities: Optional[List[str]] = None

class AmadeusIntegration:
    def __init__(self):
        self.api_key = os.getenv("AMADEUS_API_KEY")
        self.api_secret = os.getenv("AMADEUS_API_SECRET")
        self.environment = os.getenv("AMADEUS_ENVIRONMENT", "test")
        
        if not self.api_key or not self.api_secret:
            raise ValueError("AMADEUS_API_KEY and AMADEUS_API_SECRET environment variables must be set")
        
        self.client = Client(
            client_id=self.api_key,
            client_secret=self.api_secret,
            hostname='production' if self.environment == 'production' else 'test'
        )
        
        logger.info(f"Amadeus client initialized in {self.environment} environment")
    
    async def _resolve_airport_code(self, location: str) -> str:
        """
        Resolve airport/city name to IATA airport code
        """
        location = location.upper().strip()
        
        # If already a 3-letter IATA code, return as-is
        if len(location) == 3 and location.isalpha():
            return location
        
        # Common city/airport mappings
        common_mappings = {
            'NEW YORK': 'JFK',
            'NYC': 'JFK', 
            'NEW YORK CITY': 'JFK',
            'LOS ANGELES': 'LAX',
            'LA': 'LAX',
            'CHICAGO': 'ORD',
            'MIAMI': 'MIA',
            'ATLANTA': 'ATL',
            'DALLAS': 'DFW',
            'DENVER': 'DEN',
            'SEATTLE': 'SEA',
            'SAN FRANCISCO': 'SFO',
            'SF': 'SFO',
            'BOSTON': 'BOS',
            'PHILADELPHIA': 'PHL',
            'PHOENIX': 'PHX',
            'HOUSTON': 'IAH',
            'DETROIT': 'DTW',
            'MINNEAPOLIS': 'MSP',
            'ORLANDO': 'MCO',
            'TAMPA': 'TPA',
            'LAS VEGAS': 'LAS',
            'VEGAS': 'LAS',
            'PORTLAND': 'PDX',
            'SAN DIEGO': 'SAN',
            'BALTIMORE': 'BWI',
            'NASHVILLE': 'BNA',
            'AUSTIN': 'AUS',
            'CHARLOTTE': 'CLT',
            'RALEIGH': 'RDU',
            'KANSAS CITY': 'MCI',
            'CLEVELAND': 'CLE',
            'CINCINNATI': 'CVG',
            'PITTSBURGH': 'PIT',
            'ST. LOUIS': 'STL',
            'SAINT LOUIS': 'STL',
            'MILWAUKEE': 'MKE',
            'INDIANAPOLIS': 'IND',
            'COLUMBUS': 'CMH',
            'SACRAMENTO': 'SMF',
            'SAN ANTONIO': 'SAT',
            'FORT LAUDERDALE': 'FLL',
            'JACKSONVILLE': 'JAX',
            'NEW ORLEANS': 'MSY',
            'MEMPHIS': 'MEM',
            'OKLAHOMA CITY': 'OKC',
            'TULSA': 'TUL',
            'ALBUQUERQUE': 'ABQ',
            'SALT LAKE CITY': 'SLC',
            'LONDON': 'LHR',
            'PARIS': 'CDG',
            'TOKYO': 'NRT',
            'BERLIN': 'BER',
            'MADRID': 'MAD',
            'ROME': 'FCO',
            'AMSTERDAM': 'AMS',
            'FRANKFURT': 'FRA',
            'ZURICH': 'ZUR',
            'BARCELONA': 'BCN',
            'MUNICH': 'MUC',
            'VIENNA': 'VIE',
            'DUBLIN': 'DUB',
            'STOCKHOLM': 'ARN',
            'COPENHAGEN': 'CPH',
            'OSLO': 'OSL',
            'HELSINKI': 'HEL',
            'TORONTO': 'YYZ',
            'VANCOUVER': 'YVR',
            'MONTREAL': 'YUL',
            'SYDNEY': 'SYD',
            'MELBOURNE': 'MEL',
            'SINGAPORE': 'SIN',
            'HONG KONG': 'HKG',
            'DUBAI': 'DXB',
            'DOHA': 'DOH',
            'WASHINGTON': 'DCA',
            'WASHINGTON, DC': 'DCA',
            'DC': 'DCA'
        }
        
        # Check common mappings first
        if location in common_mappings:
            return common_mappings[location]
        
        # Try to search for airports by keyword
        try:
            airports = await self.search_airports(location)
            if airports and len(airports) > 0:
                # Return the first airport's IATA code
                airport = airports[0]
                if 'iataCode' in airport:
                    return airport['iataCode']
                elif 'code' in airport:
                    return airport['code']
        except Exception as e:
            logger.warning(f"Airport search failed for '{location}': {e}")
        
        # Try to search for cities and get main airport
        try:
            cities = await self.search_cities(location)
            if cities and len(cities) > 0:
                city = cities[0]
                if 'iataCode' in city:
                    return city['iataCode']
                elif 'code' in city:
                    return city['code']
        except Exception as e:
            logger.warning(f"City search failed for '{location}': {e}")
        
        # If all else fails, raise an error with helpful message
        raise Exception(f"Could not resolve '{location}' to a valid airport code. Please use a 3-letter IATA code (e.g., JFK, LAX, LHR) or a major city name.")
    
    async def search_flights(self, request: FlightSearchRequest) -> List[FlightOffer]:
        """Search for flights using Amadeus API"""
        try:
            # Validate and resolve airport codes
            origin_code = await self._resolve_airport_code(request.origin)
            destination_code = await self._resolve_airport_code(request.destination)
            
            # Validate dates
            try:
                departure_date = datetime.strptime(request.departure_date, '%Y-%m-%d')
                if request.return_date:
                    return_date = datetime.strptime(request.return_date, '%Y-%m-%d')
                    if return_date <= departure_date:
                        raise Exception("Return date must be after departure date")
            except ValueError:
                raise Exception("Invalid date format. Use YYYY-MM-DD format.")
            
            # Prepare search parameters
            search_params = {
                'originLocationCode': origin_code,
                'destinationLocationCode': destination_code,
                'departureDate': request.departure_date,
                'adults': request.adults,
                'max': request.max_results,
                'travelClass': request.travel_class
            }
            
            if request.return_date:
                search_params['returnDate'] = request.return_date
            
            if request.children > 0:
                search_params['children'] = request.children
            
            logger.info(f"Searching flights from {origin_code} to {destination_code}")
            
            # Make API call
            response = self.client.shopping.flight_offers_search.get(**search_params)
            
            # Process results
            flights = []
            for offer in response.data:
                flight_offer = FlightOffer(
                    id=offer.get('id'),
                    source=offer.get('source'),
                    price=offer.get('price'),
                    itineraries=offer.get('itineraries'),
                    travelerPricings=offer.get('travelerPricings'),
                    validatingAirlineCodes=offer.get('validatingAirlineCodes')
                )
                flights.append(flight_offer)
            
            logger.info(f"Found {len(flights)} flight offers")
            return flights
            
        except ResponseError as error:
            logger.error(f"Amadeus ResponseError: {error}")
            raise Exception(f"Flight search failed: {str(error)}")
        except Exception as e:
            logger.error(f"Flight search error: {e}")
            raise Exception(f"Flight search failed: {str(e)}")

    async def flexible_flight_search(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1
    ) -> List[FlightOffer]:
        """Search for flights with flexible dates"""
        try:
            origin_code = await self._resolve_airport_code(origin)
            destination_code = await self._resolve_airport_code(destination)
            
            search_params = {
                'origin': origin_code,
                'destination': destination_code,
                'departureDate': departure_date,
                'adults': adults
            }
            
            if return_date:
                search_params['returnDate'] = return_date
            
            response = self.client.shopping.flight_dates.get(**search_params)
            
            flights = []
            for offer in response.data:
                flight_offer = FlightOffer(
                    id=offer.get('id'),
                    price=offer.get('price'),
                    itineraries=[{
                        'departure_date': offer.get('departureDate'),
                        'return_date': offer.get('returnDate'),
                        'origin': origin_code,
                        'destination': destination_code
                    }]
                )
                flights.append(flight_offer)
            
            return flights
            
        except ResponseError as error:
            logger.error(f"Flexible flight search error: {error}")
            raise Exception(f"Flexible flight search failed: {str(error)}")
        except Exception as e:
            logger.error(f"Flexible flight search error: {e}")
            raise Exception(f"Flexible flight search failed: {str(e)}")

    async def search_hotels(self, request: HotelSearchRequest) -> List[HotelOffer]:
        """Search for hotels using Amadeus API"""
        try:
            # Get hotel offers by city
            response = self.client.shopping.hotel_offers.get(
                cityCode=request.location[:3].upper(),  # Use first 3 chars as city code
                checkInDate=request.check_in,
                checkOutDate=request.check_out,
                adults=request.guests,
                rooms=request.rooms
            )
            
            hotels = []
            for hotel_data in response.data:
                hotel_info = hotel_data.get('hotel', {})
                offers = hotel_data.get('offers', [])
                
                # Get best offer (usually first one)
                best_offer = offers[0] if offers else {}
                
                hotel_offer = HotelOffer(
                    id=hotel_info.get('hotelId'),
                    name=hotel_info.get('name'),
                    rating=hotel_info.get('rating'),
                    price=best_offer.get('price'),
                    location=hotel_info.get('address'),
                    amenities=hotel_info.get('amenities', [])
                )
                hotels.append(hotel_offer)
            
            logger.info(f"Found {len(hotels)} hotel offers")
            return hotels
            
        except ResponseError as error:
            logger.error(f"Hotel search error: {error}")
            # Return empty list for test environment
            return []
        except Exception as e:
            logger.error(f"Hotel search error: {e}")
            return []

    async def search_airports(self, keyword: str) -> List[Dict[str, Any]]:
        """Search for airports by keyword"""
        try:
            response = self.client.reference_data.locations.get(
                keyword=keyword,
                subType='AIRPORT'
            )
            
            airports = []
            for location in response.data:
                airport = {
                    'iataCode': location.get('iataCode'),
                    'name': location.get('name'),
                    'address': location.get('address', {}),
                    'geoCode': location.get('geoCode', {})
                }
                airports.append(airport)
            
            return airports
            
        except ResponseError as error:
            logger.error(f"Airport search error: {error}")
            return []
        except Exception as e:
            logger.error(f"Airport search error: {e}")
            return []

    async def search_cities(self, keyword: str) -> List[Dict[str, Any]]:
        """Search for cities by keyword"""
        try:
            response = self.client.reference_data.locations.get(
                keyword=keyword,
                subType='CITY'
            )
            
            cities = []
            for location in response.data:
                # Get the main airport for the city
                city_data = {
                    'iataCode': location.get('iataCode'),
                    'name': location.get('name'),
                    'address': location.get('address', {}),
                    'geoCode': location.get('geoCode', {})
                }
                
                # If no IATA code, try to find associated airports
                if not city_data['iataCode']:
                    try:
                        # Search for airports in this city
                        city_name = location.get('name', '')
                        if city_name:
                            airport_response = self.client.reference_data.locations.get(
                                keyword=city_name,
                                subType='AIRPORT'
                            )
                            if airport_response.data:
                                # Use the first airport's IATA code
                                city_data['iataCode'] = airport_response.data[0].get('iataCode')
                    except:
                        pass  # Continue without airport code
                
                cities.append(city_data)
            
            return cities
            
        except ResponseError as error:
            logger.error(f"City search error: {error}")
            return []
        except Exception as e:
            logger.error(f"City search error: {e}")
            return []

# Create a singleton instance
amadeus_integration = AmadeusIntegration()
