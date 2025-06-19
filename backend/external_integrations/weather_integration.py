import asyncio
import aiohttp
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)

# Pydantic models
class WeatherData(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    pressure: float
    visibility: float
    uv_index: float
    wind_speed: float
    wind_direction: int
    weather_code: int
    description: str
    timestamp: datetime

class WeatherForecast(BaseModel):
    date: str
    max_temperature: float
    min_temperature: float
    weather_code: int
    description: str
    precipitation_probability: int
    precipitation_sum: float
    wind_speed_max: float

class WeatherIntegration:
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1"
        self.weather_codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            56: "Light freezing drizzle",
            57: "Dense freezing drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            66: "Light freezing rain",
            67: "Heavy freezing rain",
            71: "Slight snow fall",
            73: "Moderate snow fall",
            75: "Heavy snow fall",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }

    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherData:
        """Get current weather for given coordinates"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'latitude': float(latitude),
                'longitude': float(longitude),
                'current_weather': 'true',
                'hourly': 'temperature_2m,relative_humidity_2m,pressure_msl,visibility,uv_index,wind_speed_10m,wind_direction_10m',
                'timezone': 'auto'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_current_weather(data)
                    else:
                        raise Exception(f"Weather API returned status {response.status}")
                        
        except Exception as e:
            logger.error(f"Current weather fetch error: {e}")
            raise Exception(f"Failed to fetch current weather: {str(e)}")

    async def get_weather_forecast(self, latitude: float, longitude: float, days: int = 5) -> List[WeatherForecast]:
        """Get weather forecast for given coordinates"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'latitude': float(latitude),
                'longitude': float(longitude),
                'daily': 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
                'timezone': 'auto',
                'forecast_days': int(days)
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_forecast_data(data)
                    else:
                        raise Exception(f"Weather API returned status {response.status}")
                        
        except Exception as e:
            logger.error(f"Weather forecast fetch error: {e}")
            raise Exception(f"Failed to fetch weather forecast: {str(e)}")

    def _parse_current_weather(self, data: Dict[str, Any]) -> WeatherData:
        """Parse current weather data from API response and convert temperature to Fahrenheit"""
        try:
            current = data.get('current_weather', {})
            hourly = data.get('hourly', {})
            
            # Get current hour index
            current_time = current.get('time', '')
            hourly_times = hourly.get('time', [])
            current_index = 0
            
            if current_time in hourly_times:
                current_index = hourly_times.index(current_time)
            
            # Extract hourly data for current time
            def get_hourly_value(key: str, default: Any = 0):
                values = hourly.get(key, [])
                return values[current_index] if current_index < len(values) else default
            
            weather_code = int(current.get('weathercode', 0))
            # Convert Celsius to Fahrenheit
            temp_c = current.get('temperature', 0)
            temp_f = temp_c * 9.0 / 5.0 + 32.0
            return WeatherData(
                temperature=round(temp_f, 1),
                feels_like=round(temp_f, 1),  # Open-Meteo doesn't provide feels_like
                humidity=get_hourly_value('relative_humidity_2m', 50),
                pressure=get_hourly_value('pressure_msl', 1013.25),
                visibility=get_hourly_value('visibility', 10000) / 1000,  # Convert to km
                uv_index=get_hourly_value('uv_index', 0),
                wind_speed=current.get('windspeed', 0),
                wind_direction=current.get('winddirection', 0),
                weather_code=weather_code,
                description=self.weather_codes.get(weather_code, "Unknown"),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Error parsing current weather: {e}")
            # Return default weather data
            return WeatherData(
                temperature=68.0,  # 20C in F
                feels_like=68.0,
                humidity=50,
                pressure=1013.25,
                visibility=10.0,
                uv_index=3.0,
                wind_speed=5.0,
                wind_direction=180,
                weather_code=1,
                description="Mainly clear",
                timestamp=datetime.now()
            )

    def _parse_forecast_data(self, data: Dict[str, Any]) -> List[WeatherForecast]:
        """Parse forecast data from API response"""
        try:
            daily = data.get('daily', {})
            dates = daily.get('time', [])
            max_temps = daily.get('temperature_2m_max', [])
            min_temps = daily.get('temperature_2m_min', [])
            weather_codes = daily.get('weather_code', [])
            precipitation_probs = daily.get('precipitation_probability_max', [])
            precipitation_sums = daily.get('precipitation_sum', [])
            wind_speeds = daily.get('wind_speed_10m_max', [])
            
            forecasts = []
            for i in range(len(dates)):
                weather_code = int(weather_codes[i]) if i < len(weather_codes) else 1
                
                forecast = WeatherForecast(
                    date=dates[i],
                    max_temperature=max_temps[i] if i < len(max_temps) else 25.0,
                    min_temperature=min_temps[i] if i < len(min_temps) else 15.0,
                    weather_code=weather_code,
                    description=self.weather_codes.get(weather_code, "Unknown"),
                    precipitation_probability=precipitation_probs[i] if i < len(precipitation_probs) else 0,
                    precipitation_sum=precipitation_sums[i] if i < len(precipitation_sums) else 0.0,
                    wind_speed_max=wind_speeds[i] if i < len(wind_speeds) else 5.0
                )
                forecasts.append(forecast)
            
            return forecasts
            
        except Exception as e:
            logger.error(f"Error parsing forecast data: {e}")
            # Return default forecast
            return [
                WeatherForecast(
                    date=datetime.now().strftime('%Y-%m-%d'),
                    max_temperature=25.0,
                    min_temperature=15.0,
                    weather_code=1,
                    description="Mainly clear",
                    precipitation_probability=10,
                    precipitation_sum=0.0,
                    wind_speed_max=5.0
                )
            ]

# Create a singleton instance
weather_integration = WeatherIntegration()
