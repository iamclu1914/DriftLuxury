import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import { api } from '../api';
import LocationDetector from './LocationDetector';
import WeatherWidget from './WeatherWidget';
import { LoadingSpinner } from './LoadingStates';
import EnhancedItinerary from './EnhancedItinerary';
import LocationAutocomplete from './LocationAutocomplete';
import FlightDetailsModal from './FlightDetailsModal';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
// Importing Framer Motion for animations if available
// If not installed, you can add it with: npm install framer-motion
// import { motion } from 'framer-motion';

const HereNowPlanner = () => {
  // Removed planningMode state since we're focusing only on instant planning
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [locationInputText, setLocationInputText] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState(null); // To store { lat, lon }
  const [formData, setFormData] = useState({
    location: '',
    mood: 'adventurous',
    budget: 'medium',
    duration_hours: 4,
    // Always set to instant plan mode
    planningMode: 'here-now'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'location') {
      setLocationInputText(value);
      // If user types again after selecting, clear the detailed selection
      if (selectedLocationDetails && value !== selectedLocationDetails.display) {
        setSelectedLocationDetails(null);
      }
    }
  };

  // Get user's current location using browser's Geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log(`Current coordinates: ${latitude}, ${longitude}`);
          setCurrentCoordinates({ lat: latitude, lon: longitude });
          
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.REACT_APP_OPENCAGE_API_KEY}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location name');
          }
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const locationName = result.components.city || 
                               result.components.town || 
                               result.components.village || 
                               result.components.county || 
                               result.formatted;
                               
            const countryName = result.components.country;
            const locationString = countryName ? `${locationName}, ${countryName}` : locationName;
            
            // Update form data with the detected location
            setFormData(prev => ({
              ...prev,
              location: locationString
            }));
            setLocationInputText(locationString);
            
            // Create a mock suggestion object similar to what would come from LocationAutocomplete
            const mockSuggestion = {
              id: `city-${locationName}`,
              display: locationString,
              name: locationName,
              type: 'city',
              address: {
                countryName: countryName
              }
            };
            
            setSelectedLocationDetails(mockSuggestion);
          } else {
            throw new Error('No location found');
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Unable to determine your location. Please enter it manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(`Error getting your location: ${error.message}`);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLocationSelected = (suggestion) => {
    console.log("[HereNowPlanner] Full OpenCage location selected:", suggestion);
    const locationString = suggestion.display;
    console.log("[HereNowPlanner] Attempting to set formData.location to:", locationString);

    setSelectedLocationDetails(suggestion); 

    setFormData(prev => {
      const newFormData = { ...prev, location: locationString };
      console.log("[HereNowPlanner] New formData in setFormData callback:", newFormData);
      return newFormData;
    });
    setLocationInputText(locationString);
  };

  // This function might be redundant now or used elsewhere. Review if it's still needed.
  const handleLocationUpdate = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    // Always show debug info
    setShowDebug(false); // Debug UI disabled
    setDebugInfo({
      status: 'Submitting request...',
      apiEndpoint: `${api.defaults.baseURL}/api/here-now/plan`,
      formData: JSON.stringify(formData, null, 2),
      error: null,
      response: null
    });

    try {
      // Log request details to debug panel
      setDebugInfo(prev => ({
        ...prev,
        status: 'Making API request...',
        request: {
          url: '/api/here-now/plan',
          method: 'POST',
          data: formData
        }
      }));

      const response = await api.post('/api/here-now/plan', formData);

      console.log('Response received:', response);

      // Log successful response
      setDebugInfo(prev => ({
        ...prev,
        status: 'Response received successfully',
        response: JSON.stringify(response.data, null, 2),
        responseStatus: response.status,
        responseHeaders: response.headers
      }));

      setResult(response.data);
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (error) {
      // Log detailed error information
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };

      if (error.response) {
        // Server responded with error
        errorInfo.responseData = error.response.data;
        errorInfo.responseStatus = error.response.status;
        errorInfo.responseHeaders = error.response.headers;
      } else if (error.request) {
        // Request made but no response
        errorInfo.requestInfo = {
          method: error.request.method,
          url: error.request.url,
          headers: error.request.headers
        };
      }

      setDebugInfo(prev => ({
        ...prev,
        status: 'Error occurred',
        error: JSON.stringify(errorInfo, null, 2),
        errorTimestamp: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

  const closeFlightModal = () => {
    setShowFlightModal(false);
    setSelectedFlight(null);
  };

  const moods = [
    { 
      value: 'adventurous', 
      label: 'Adventure Seeker', 
      description: 'Discover hidden gems and thrilling experiences',
      icon: '🧗‍♂️'
    },
    { 
      value: 'relaxed', 
      label: 'Leisure & Wellness', 
      description: 'Unwind with peaceful and mindful activities',
      icon: '🧘‍♀️'
    },
    { 
      value: 'cultural', 
      label: 'Cultural Explorer', 
      description: 'Immerse in local arts and heritage',
      icon: '🏛️'
    },
    { 
      value: 'foodie', 
      label: 'Culinary Journey', 
      description: 'Savor local flavors and dining experiences',
      icon: '🍽️'
    },
    { 
      value: 'social', 
      label: 'Social Discovery', 
      description: 'Connect with locals and fellow travelers',
      icon: '👥'
    },
    { 
      value: 'romantic', 
      label: 'Romantic Escape', 
      description: 'Create memorable moments together',
      icon: '💑'
    }
  ];

  const budgets = [
    { 
      value: 'low', 
      label: 'Essential', 
      description: 'Under $50 - Smart and savvy choices',
      icon: '💰'
    },
    { 
      value: 'medium', 
      label: 'Balanced', 
      description: '$50-150 - Quality experiences',
      icon: '💰💰'
    },
    { 
      value: 'high', 
      label: 'Premium', 
      description: '$150+ - Luxury and exclusivity',
      icon: '💰💰💰'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-[var(--color-text)] font-serif">
      {/* Main content section */}
      <main className="overflow-hidden">
        {/* Hero Section with Immersive Luxury Design */}
        <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-[128px] opacity-20 animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-[128px] opacity-10 animate-pulse-slow" style={{animationDelay: '2.5s'}}></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
              {/* Hero content */}
              <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
                {/* Subtle gold line accent */}
                <div className="hidden lg:block w-24 h-0.5 mb-10 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)]"></div>
                
                {/* Elegant tagline */}
                <p className="text-[var(--color-gold-light)] font-serif tracking-widest text-sm lg:text-base mb-4 lg:mb-6 uppercase font-medium">ELEVATE YOUR JOURNEY</p>
                
                {/* Luxury heading with gradient */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight leading-tight mb-6 lg:mb-8">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Extraordinary</span> Experiences<br/>
                  <span className="text-[var(--color-text)]">Await Your Arrival</span>
                </h1>
                
                {/* Elegant description */}
                <p className="text-[var(--color-text-secondary)] text-lg md:text-xl font-serif tracking-wide leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
                  Discover bespoke itineraries meticulously crafted for the discerning traveler. Your extraordinary journey begins precisely where you are.
                </p>
                
                {/* CTA button with luxury styling */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 items-center">
                  <a href="#planner" className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    <button className="relative px-8 py-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 rounded-lg font-serif tracking-wide font-medium text-lg shadow-lg shadow-[var(--color-gold-dark)]/20 hover:shadow-[var(--color-gold)]/40 transition-all duration-300 group-hover:scale-[1.01]">
                      PLAN MY JOURNEY
                    </button>
                  </a>
                  <a href="#" className="text-[var(--color-text-secondary)] font-serif text-lg hover:text-[var(--color-gold-light)] transition-colors duration-300 relative group px-4 py-2">
                    <span>Learn more</span>
                    <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </a>
                </div>
              </div>
              
              {/* Hero image with luxury frame */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative">
                  {/* Gold gradient frame */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-xl opacity-50 blur-md"></div>
                  
                  {/* Luxury frame border */}
                  <div className="relative border-8 border-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
                    <div className="aspect-[4/3] w-full bg-gray-800/50 overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80" 
                        alt="Luxury travel experience" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-in-out"
                      />
                    </div>
                    
                    {/* Image caption with luxury styling */}
                    <div className="absolute bottom-0 inset-x-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700/30">
                      <p className="text-center text-sm text-[var(--color-gold-light)] font-serif italic tracking-wide">
                        "The journey of a thousand miles begins with a single step"</p>
                    </div>
                  </div>
                  
                  {/* Floating decorative elements */}
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-xl border border-gray-700/30">
                    <div className="w-8 h-8 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur opacity-90"></div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-xl border border-gray-700/30">
                    <div className="w-6 h-6 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur opacity-90"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Luxury brand markers */}
            <div className="mt-20 lg:mt-32 flex flex-wrap justify-center gap-x-16 gap-y-8">
              <div className="text-[var(--color-text-secondary)] font-serif text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase">Four Seasons</div>
              <div className="text-[var(--color-text-secondary)] font-serif text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase">Ritz Carlton</div>
              <div className="text-[var(--color-text-secondary)] font-serif text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase">Aman Resorts</div>
              <div className="text-[var(--color-text-secondary)] font-serif text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase">Belmond</div>
              <div className="text-[var(--color-text-secondary)] font-serif text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase">St. Regis</div>
            </div>
          </div>
        </section>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="max-w-5xl mx-auto" id="planner">
            {/* Planner Form with Glassmorphism effect */}
            <div className="glassmorphism rounded-2xl border border-gray-700/50 shadow-modern-lg overflow-hidden">
              <div className="p-6 sm:p-8 md:p-12 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
                
                {/* Form Header */}
                <div className="relative z-10 mb-10 text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold tracking-tight text-[var(--color-text)] mb-4 leading-tight">Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Extraordinary</span> Journey</h2>
                  <p className="text-[var(--color-text-secondary)] font-serif text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">Elevate your experience with bespoke itineraries crafted for discerning travelers</p>
                </div>
                
                {/* Form Content */}
                {console.log("[HereNowPlanner] formData.location before button render:", formData.location)}
                {console.log("[HereNowPlanner] 'loading' state before button render:", loading)}
                <form onSubmit={handleSubmit} className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                    {/* Location Field with Autocomplete */}
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="location" className="block mb-3 text-[var(--color-text)] font-serif text-lg sm:text-xl font-medium tracking-wide">Your Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        </div>
                        <div className="flex">
                          <LocationAutocomplete
                            name="location" // Added name prop
                            value={locationInputText} // Correctly bound to locationInputText
                            onChange={handleInputChange} // Use the modified handleInputChange
                            onLocationSelect={handleLocationSelected} // Corrected prop name
                            className="block w-full rounded-l-xl py-3.5 px-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-[var(--color-text)] shadow-inner placeholder-gray-400/70"
                            placeholder="Enter your current location"
                          />
                          <button 
                            type="button"
                            onClick={handleGetCurrentLocation}
                            className="flex items-center justify-center py-3.5 px-3 sm:px-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-[var(--color-text)] rounded-r-xl hover:opacity-90 transition-all duration-300 relative overflow-hidden shadow-lg border border-[var(--color-gold-dark)] border-l-0"
                            disabled={locationLoading}
                          >
                            {locationLoading ? (
                              <LoadingSpinner size="sm" color="gold" />
                            ) : (
                              <>
                                <span className="mr-2 hidden sm:inline text-sm font-medium">Detect</span>
                                <svg className="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {selectedLocationDetails && selectedLocationDetails.name && (
                        <div className="mt-3 p-3 bg-gray-800/60 backdrop-blur-sm border border-[var(--color-gold-dark)]/30 rounded-xl flex items-center space-x-3 shadow-lg">
                          <svg className="w-6 h-6 text-[var(--color-gold)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-[var(--color-gold-light)] font-cormorant text-lg tracking-wide">
                            {selectedLocationDetails.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Mood Selection */}
                    <div>
                      <label htmlFor="mood" className="block mb-2 text-[var(--color-text)] font-cormorant text-xl font-medium">Your Mood</label>
                      <div className="relative">
                        <select 
                          id="mood" 
                          name="mood" 
                          value={formData.mood} 
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-10 py-4 bg-gray-800/70 border border-gray-700/50 rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] appearance-none font-cormorant text-lg"
                        >
                          {moods.map((mood) => (
                            <option key={mood.value} value={mood.value}>{mood.label} {mood.icon}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Budget Selection */}
                    <div>
                      <label htmlFor="budget" className="block mb-2 text-[var(--color-text)] font-cormorant text-xl font-medium">Your Budget</label>
                      <div className="relative">
                        <select 
                          id="budget" 
                          name="budget" 
                          value={formData.budget} 
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-10 py-4 bg-gray-800/70 border border-gray-700/50 rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] appearance-none font-cormorant text-lg"
                        >
                          {budgets.map((budget) => (
                            <option key={budget.value} value={budget.value}>{budget.label} {budget.icon}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Duration Slider */}
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="duration_hours" className="block mb-2 text-[var(--color-text)] font-cormorant text-xl font-medium">
                        Duration: {formData.duration_hours} hours
                      </label>
                      <input 
                        type="range" 
                        id="duration_hours" 
                        name="duration_hours" 
                        min="1" 
                        max="12" 
                        step="1" 
                        value={formData.duration_hours} 
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-800/70 rounded-lg appearance-none cursor-pointer modern-range"
                      />
                      <div className="flex justify-between text-[var(--color-text-secondary)] text-sm mt-2 font-cormorant">
                        <span>1 hour</span>
                        <span>6 hours</span>
                        <span>12 hours</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="text-center mt-8">
                    {/* Decorative divider */}
                    <div className="mx-auto mb-8 flex items-center justify-center">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-gold-dark)]"></div>
                      <div className="mx-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] transform rotate-45 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] blur-sm opacity-70"></div>
                        </div>
                      </div>
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-gold-dark)]"></div>
                    </div>
                    
                    {/* Luxury submit button with glowing effect */}
                    {loading ? (
                      /* Minimal loading indicator - completely separate from button */
                      <div className="mini-loader-container">
                        <div className="mini-loader-spinner"></div>
                        <span className="mini-loader-text">PROCESSING...</span>
                      </div>
                    ) : (
                      /* Normal button - only rendered when not loading */
                      <div className="relative group inline-block">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full opacity-70 group-hover:opacity-100 blur transition duration-500 group-hover:blur-md"></div>
                        <button 
                          type="submit" 
                          className="relative px-6 py-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 rounded-full font-serif font-medium text-lg tracking-wider shadow-lg shadow-[var(--color-gold-dark)]/20 hover:shadow-[var(--color-gold)]/40 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!formData.location}
                        >
                          <span className="mr-2">✦</span> DESIGN MY PERFECT JOURNEY <span className="ml-2">✦</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Luxury note with star icon */}
                    <div className="mt-6 text-sm text-[var(--color-text-secondary)] font-serif tracking-wide flex items-center justify-center">
                      <span className="text-[var(--color-gold)] mr-2">★</span>
                      <span>Crafted with exquisite attention to your preferences</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Results Section */}
            <div id="results" className="mt-12">
              {loading && <LoadingSpinner />}
              {result && result.success && result.itinerary && (
                <div className="mt-8">
                  <EnhancedItinerary 
                    overview={result.itinerary.overview} 
                    dining={result.itinerary.dining}
                    events={result.itinerary.events}
                    attractions={result.itinerary.attractions}
                    fun={result.itinerary.fun}
                    weather={result.weather}
                  />
                </div>
              )}
              {result && !result.success && (
                <div className="text-center text-red-400 p-8 glassmorphism rounded-2xl">
                    <p className='text-2xl mb-2'>😔</p>
                    <p className='font-serif text-xl'>Sorry, we couldn't generate an itinerary.</p>
                    <p className='text-sm text-gray-400'>Please try again with a different location or mood.</p>
                </div>
              )}
              {result && (
        <section id="results" className="max-w-6xl mx-auto px-2 sm:px-6 py-10">
          <EnhancedItinerary
            overview={result.itinerary?.overview || {}}
            dining={result.itinerary?.dining || []}
            events={result.itinerary?.events || []}
            attractions={result.itinerary?.attractions || []}
            fun={result.itinerary?.fun || []}
            weather={result.weather || {}}
          />
        </section>
      )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HereNowPlanner;