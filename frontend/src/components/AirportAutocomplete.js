import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * AirportAutocomplete
 * Allows user to type a city or airport name/code and returns nearby airport suggestions
 * (powered by backend endpoint /api/locations/airports which proxies Amadeus API).
 *
 * Props:
 *  - name: string (input field name)
 *  - value: string (controlled value from parent state)
 *  - onChange: function(e) -> void (standard input onChange for parent state sync)
 *  - onAirportSelect: function(iataCode:string, display:string) -> void (callback when a suggestion selected)
 *  - label: optional string label displayed above input
 *  - placeholder: optional string placeholder
 *  - required: boolean (default false)
 *  - className: string additional tailwind classes for input
 */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AirportAutocomplete = ({
  name,
  value,
  onChange,
  onAirportSelect,
  label,
  placeholder = 'Enter city or airport',
  required = false,
  className = 'w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white',
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const query = value?.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/locations/airports`, {
          params: { keyword: query },
        });
        const airports = res.data?.airports || [];
        // Map into display-friendly objects
        const formatted = airports.slice(0, 10).map((a, idx) => ({
          id: a.id || `${a.iataCode}-${idx}`,
          iataCode: a.iataCode?.toUpperCase() || '',
          name: a.name,
          city: a.address?.cityName || a.cityName || '',
          country: a.address?.countryName || a.countryName || '',
        }));
        setSuggestions(formatted);
        setShowSuggestions(true);
      } catch (err) {
        console.error('AirportAutocomplete search error', err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  const handleSuggestionClick = (sugg) => {
    // Fire parent change with display value (city - airport code)
    const display = `${sugg.city || sugg.name} (${sugg.iataCode})`;
    const event = {
      target: {
        name,
        value: display,
      },
    };
    onChange(event);
    if (onAirportSelect) onAirportSelect(sugg.iataCode, display);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-lg font-bold text-gray-800 mb-3">{label}</label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          required={required}
          autoComplete="off"
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
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
          {suggestions.map((sugg) => (
            <button
              key={sugg.id}
              type="button"
              onClick={() => handleSuggestionClick(sugg)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">✈️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {sugg.name} ({sugg.iataCode})
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {sugg.city}, {sugg.country}
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

export default AirportAutocomplete;
