import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ location, coordinates }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coordinates) {
      fetchWeather(coordinates);
    }
  }, [coordinates]);

  const fetchWeather = async (coords) => {
    setLoading(true);
    try {
      // Using a free weather API (you may want to get an API key for production)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&hourly=temperature_2m,precipitation_probability&timezone=auto`
      );
      const data = await response.json();
      
      if (data.current_weather) {
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode),
          emoji: getWeatherEmoji(data.current_weather.weathercode),
          precipitation: data.hourly?.precipitation_probability?.[0] || 0
        });
      }
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }
    setLoading(false);
  };

  const getWeatherCondition = (code) => {
    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
  };

  const getWeatherEmoji = (code) => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 65) return '🌧️';
    if (code >= 71 && code <= 75) return '❄️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  const getActivitySuggestion = () => {
    if (!weather) return '';
    
    if (weather.precipitation > 70) {
      return 'Perfect weather for museums and indoor dining!';
    } else if (weather.temperature > 25) {
      return 'Great weather for outdoor activities and rooftop dining!';
    } else if (weather.temperature < 5) {
      return 'Cozy weather for warm cafes and indoor attractions!';
    } else {
      return 'Perfect weather for exploring!';
    }
  };

  if (loading) {
    return (
      <div className="weather-widget bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full"></div>
          <div className="animate-pulse w-32 h-4 bg-blue-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-widget bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-4 border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{weather.emoji}</span>
          <div>
            <div className="font-bold text-blue-800">{weather.temperature}°C</div>
            <div className="text-sm text-blue-600">{weather.condition}</div>
          </div>
        </div>
        {weather.precipitation > 30 && (
          <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            🌧️ {weather.precipitation}%
          </div>
        )}
      </div>
      <div className="text-xs text-blue-700 font-medium">
        💡 {getActivitySuggestion()}
      </div>
    </div>
  );
};

export default WeatherWidget;