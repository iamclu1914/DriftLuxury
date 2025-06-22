import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LocationAutocomplete = ({ 
  name, 
  value, 
  onChange, // Standard onChange for input field value
  onLocationSelect, // Callback with the full suggestion object
  placeholder, 
  className, 
  required = false,
  label,
  latitude,   // New prop for user's current latitude
  longitude,  // New prop for user's current longitude
  radius = 50000 // Optional: radius in meters (e.g., 50km), can be adjusted
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!OPENCAGE_API_KEY) {
      console.error('OpenCage API key is missing. Please set REACT_APP_OPENCAGE_API_KEY in your .env file.');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      let apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=7&no_annotations=1`;

      if (latitude && longitude) {
        apiUrl += `&proximity=${latitude},${longitude}`;
      }

      const response = await axios.get(apiUrl);
      const results = response.data.results || [];

      const formattedSuggestions = results.map((result, index) => {
        let subtitle = '';
        const C = result.components;
        if (C._type === 'city' || C._type === 'town' || C._type === 'village') {
          subtitle = [C.state, C.country].filter(Boolean).join(', ');
        } else if (C.road) {
          subtitle = [C.city, C.state, C.country].filter(Boolean).join(', ');
        } else {
          subtitle = [C.state, C.country].filter(Boolean).join(', ');
        }
        if (!subtitle && result.formatted) {
            // Fallback if specific components don't make a good subtitle
            const parts = result.formatted.split(',');
            if (parts.length > 1) subtitle = parts.slice(1).join(',').trim();
        }

        let icon = '📍'; // Default icon
        if (C._type === 'country') icon = '🌍';
        else if (C._type === 'city' || C._type === 'town' || C._type === 'village') icon = '🏙️';
        else if (C._type === 'postcode') icon = '📮';
        else if (C._type === 'road') icon = '🛣️';
        else if (C._type === 'building' || C._type === 'house_number') icon = '🏠';

        return {
          id: result.annotations?.geohash || `${result.formatted}-${index}`, // geohash is good, fallback if not present
          display: result.formatted, // What the user sees and what goes into input on selection
          value: result.formatted,   // Value for the input field
          name: C[C._type] || C.city || C.town || C.village || C.county || C.state || C.country || result.formatted.split(',')[0],
          subtitle: subtitle,
          type: C._type || 'location',
          icon: icon,
          address: C, // Full components object
          geometry: result.geometry, // { lat, lng }
          originalOpenCageResult: result // Keep the original result for flexibility
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Error searching locations with OpenCage:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);
    
    // Debounce the API call
    clearTimeout(window.locationSearchTimeout);
    window.locationSearchTimeout = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    // Update the input field's displayed text using the suggestion's display string
    const displayEvent = {
      target: {
        name: name, // Name of the input field
        value: suggestion.display // Use the user-friendly display string
      }
    };
    onChange(displayEvent); // This updates the parent's state for the input's text value

    // If an onLocationSelect callback is provided, call it with the full suggestion object
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }

    setShowSuggestions(false);
    // Consider not re-focusing, or making it conditional, to allow user to move to next field.
    // inputRef.current?.focus(); 
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-lg font-bold text-gray-800 mb-3">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          required={required}
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.display}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                  <div className="text-xs text-indigo-600 mt-1">
                    {suggestion.type === 'airport' ? 'Airport' : 'City'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;