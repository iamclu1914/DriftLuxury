import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import { api } from '../api';
import LocationDetector from './LocationDetector';
import WeatherWidget from './WeatherWidget';
import { LoadingSpinner } from './LoadingStates';
import EnhancedItinerary from './EnhancedItinerary';
import LocationAutocomplete from './LocationAutocomplete';
import FlightDetailsModal from './FlightDetailsModal';
// Importing Framer Motion for animations if available
// If not installed, you can add it with: npm install framer-motion
// import { motion } from 'framer-motion';

const HereNowPlanner = () => {
  // Removed planningMode state since we're focusing only on instant planning
  const [loading, setLoading] = useState(false);
  const [tripPlanLoading, setTripPlanLoading] = useState(false);
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
    
    // Always use the here-now mode for instant planning
    
    // Always show debug info
    setShowDebug(false); // Debug UI disabled
    setDebugInfo({
      status: 'Submitting request...',
      apiEndpoint: `${api.defaults.baseURL}/api/ai/generate-itinerary`,
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
          url: '/api/ai/generate-itinerary',
          method: 'POST',
          data: formData
        }
      }));

      const response = await api.post('/api/ai/generate-itinerary', formData);

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

const handleTripPlan = async (e) => {
    e.preventDefault();
    setTripPlanLoading(true);
    try {
      const response = await api.post('/api/trip/plan-and-book', formData);
      setResult(response.data);
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      setDebugInfo(prev => ({
        ...prev,
        status: 'Error occurred',
        error: JSON.stringify(error.response?.data || error.message, null, 2),
        errorTimestamp: new Date().toISOString()
      }));
    } finally {
      setTripPlanLoading(false);
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
      {/* Redesigned Header with Glassmorphism effect */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-gray-700/30 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/4 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-accent-dark)] opacity-0 group-hover:opacity-70 blur-xl transition-all duration-500 group-hover:duration-200"></div>
                <div className="relative flex items-center">
                  <div className="mr-2 text-3xl sm:text-4xl font-serif font-semibold tracking-wide bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-light)] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">DRIFT</div>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-4">
              <a href="/" className="relative px-4 py-2 group">
                <span className="relative z-10 font-medium tracking-wide text-[var(--color-gold)] font-serif">Explore</span>
                <span className="absolute inset-x-0 bottom-1 h-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-20 group-hover:opacity-100 rounded-full blur-sm group-hover:blur-md transition-all duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></span>
              </a>
              <a href="/trip-mode" className="relative px-4 py-2 group">
                <span className="relative z-10 font-medium tracking-wide text-[var(--color-text-secondary)] group-hover:text-[var(--color-gold)] transition-colors duration-300 font-serif">Plan Trip</span>
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-12 h-12 relative flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] shadow hover:shadow-md transition-all duration-300 focus:outline-none border border-gray-700/30"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
                <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out mt-1 ${isMenuOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
                <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>
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
                  <p className="text-[var(--color-text-secondary)] font-serif text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">Elevate your experience with bespoke itineraries crafted for discerning travelers</p>
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
                    <div className="relative group inline-block">
                      {/* Glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full opacity-70 group-hover:opacity-100 blur transition duration-500 group-hover:blur-md"></div>
                      
                      <button 
                        type="submit" 
                        className="relative px-12 py-5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 rounded-full font-serif font-medium text-lg tracking-wider shadow-lg shadow-[var(--color-gold-dark)]/20 hover:shadow-[var(--color-gold)]/40 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !formData.location}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <LoadingSpinner size="sm" color="dark" />
                            <span className="ml-3 font-medium">CRAFTING YOUR JOURNEY...</span>
                          </div>
                        ) : (
                          <>
                            <span className="mr-2">✦</span> DESIGN MY PERFECT JOURNEY <span className="ml-2">✦</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Luxury note with star icon */}
                    <div className="mt-6 text-sm text-[var(--color-text-secondary)] font-serif tracking-wide flex items-center justify-center">
                      <span className="text-[var(--color-gold)] mr-2">★</span>
                      <span>Crafted with exquisite attention to your preferences</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Results Section with Luxury Styling */}
            {result && (
              <div className="mt-24 relative">
                {/* Decorative background elements */}
                <div className="absolute top-1/4 -left-24 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-[120px] opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-1/3 -right-24 w-80 h-80 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-[100px] opacity-10 pointer-events-none"></div>
                
                {/* Luxury divider */}
                <div className="mb-16 flex items-center justify-center">
                  <div className="h-px w-32 bg-gradient-to-r from-transparent to-[var(--color-gold-dark)]"></div>
                  <div className="mx-6 px-6 py-1.5 border border-[var(--color-gold-dark)] rounded-full relative">
                    <span className="text-[var(--color-gold-light)] font-serif tracking-widest text-sm uppercase relative z-10">YOUR BESPOKE JOURNEY</span>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-full"></div>
                  </div>
                  <div className="h-px w-32 bg-gradient-to-l from-transparent to-[var(--color-gold-dark)]"></div>
                </div>
                
                {/* Elegant frame around results */}
                <div className="relative p-1 rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-2xl opacity-30 blur-sm"></div>
                  <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 shadow-2xl border border-gray-800/50">
                    <EnhancedItinerary 
                      itinerary={result.itinerary} 
                      onTripPlan={handleTripPlan} 
                      tripPlanLoading={tripPlanLoading}
                      onFlightSelect={(flight) => {
                        setSelectedFlight(flight);
                        setShowFlightModal(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Debug Panel with Luxury Styling */}
            {showDebug && (
              <div className="mt-24 mb-16 relative">
                {/* Decorative element */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-xl border border-gray-700/30 z-10">
                  <div className="w-8 h-8 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur opacity-90"></div>
                </div>
                
                {/* Debug panel container with luxury frame */}
                <div className="relative">
                  {/* Gold gradient frame */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-xl opacity-30 blur-[1px]"></div>
                  
                  <div className="relative p-8 bg-gray-900/90 backdrop-blur-sm border border-gray-800/50 rounded-xl shadow-2xl text-sm text-gray-200 overflow-hidden">
                    {/* Debug header with luxury styling */}
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Developer Insights</h3>
                    </div>
                    
                    {/* Subtle divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-gold-dark)]/30 to-transparent mb-6"></div>
                    
                    {/* Debug content with scrollable container */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2">
                      {debugInfo ? (
                        <pre className="whitespace-pre-wrap break-all font-mono text-[var(--color-text-secondary)] leading-relaxed p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                          {(() => {
                            try {
                              return JSON.stringify(debugInfo, null, 2);
                            } catch (e) {
                              return `Error stringifying debugInfo: ${e.message}`;
                            }
                          })()}
                        </pre>
                      ) : (
                        <div className="italic text-[var(--color-text-secondary)] font-serif text-center py-12">
                          <span className="text-[var(--color-gold)] mr-2">✦</span>
                          No debug information is currently available
                          <span className="text-[var(--color-gold)] ml-2">✦</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 bg-opacity-80 relative overflow-hidden border-t border-gray-800/30">
        {/* Luxury decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-10 -translate-y-1/2 -translate-x-1/4"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-3xl opacity-10 translate-y-1/3 translate-x-1/4"></div>
        <div className="grid-pattern absolute inset-0 opacity-5"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 text-sm max-w-6xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center mb-8">
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-accent-dark)] opacity-0 group-hover:opacity-70 blur-xl transition-all duration-500 group-hover:duration-200"></div>
                  <div className="relative flex items-center">
                    <div className="h-12 w-12 mr-4 bg-gradient-to-br from-[var(--color-gold)] via-[var(--color-gold-dark)] to-[var(--color-gold-light)] rounded-lg flex items-center justify-center shadow-xl border border-gray-700/20 group-hover:scale-105 transition-transform duration-300">
                      <span className="text-[var(--color-text)] font-serif font-bold tracking-wide text-2xl">D</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">DRIFT</h3>
                      <span className="text-xs text-[var(--color-text-secondary)] tracking-widest uppercase font-medium">Travel Unbounded</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed font-serif">
                Experience extraordinary journeys curated to your refined tastes and preferences. Elevate your travel with personalized sophistication.
              </p>
              <div className="mt-6">
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 font-serif tracking-wide">Connect With Us</p>
                <div className="flex space-x-4">
                  <a href="#" className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300 scale-110"></div>
                    <div className="bg-gray-800 border border-gray-700/30 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] p-2.5 rounded-full transition-all duration-300 relative flex items-center justify-center shadow-lg group-hover:shadow-[var(--color-gold)]/20 group-hover:scale-110">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                  </a>
                  <a href="#" className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300 scale-110"></div>
                    <div className="bg-gray-800 border border-gray-700/30 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] p-2.5 rounded-full transition-all duration-300 relative flex items-center justify-center shadow-lg group-hover:shadow-[var(--color-gold)]/20 group-hover:scale-110">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </div>
                  </a>
                  <a href="#" className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300 scale-110"></div>
                    <div className="bg-gray-800 border border-gray-700/30 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] p-2.5 rounded-full transition-all duration-300 relative flex items-center justify-center shadow-lg group-hover:shadow-[var(--color-gold)]/20 group-hover:scale-110">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                      </svg>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-6"> 
              <div className="relative">
                <h4 className="text-lg font-serif font-medium tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)] mb-6 flex items-center">
                  <span className="w-7 h-7 mr-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex items-center justify-center shadow-lg border border-gray-700/30 group-hover:border-[var(--color-gold)]/20">
                    <svg className="w-3.5 h-3.5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                  </span>
                  COMPANY
                </h4>
                <ul className="space-y-3.5">
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">About Us</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Careers</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Blog</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Press</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <h4 className="text-lg font-serif font-medium tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)] mb-6 flex items-center">
                  <span className="w-7 h-7 mr-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex items-center justify-center shadow-lg border border-gray-700/30 group-hover:border-[var(--color-gold)]/20">
                    <svg className="w-3.5 h-3.5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  SUPPORT
                </h4>
                <ul className="space-y-3.5">
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Help Center</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Safety Center</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Cancellations</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors flex items-center group">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="font-serif tracking-wide group-hover:translate-x-1 transition-transform duration-300">Contact Us</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="lg:ml-4 relative">
              <h4 className="text-lg font-serif font-medium tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)] mb-6 flex items-center">
                <span className="w-7 h-7 mr-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex items-center justify-center shadow-lg border border-gray-700/30">
                  <svg className="w-3.5 h-3.5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                NEWSLETTER
              </h4>
              <form className="mt-5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-dark)]/10 to-[var(--color-gold)]/5 blur-xl opacity-30 rounded-xl"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="relative">
                    <input
                      className="w-full px-5 py-4 rounded-lg bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 text-[var(--color-text)] placeholder-gray-400/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)]/20 transition-all duration-300 font-serif"
                      placeholder="Your email address"
                      type="email"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-gold-light)]/5 to-[var(--color-gold)]/5 opacity-30 rounded-lg pointer-events-none"></div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    <button
                      className="relative w-full px-5 py-3.5 rounded-lg bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 font-medium transition-all duration-300 shadow-lg shadow-[var(--color-gold-dark)]/20 hover:shadow-[var(--color-gold)]/40 font-serif tracking-wide group-hover:scale-[1.01]"
                      type="submit"
                    >
                      SUBSCRIBE
                    </button>
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    <div className="p-3 bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-inner flex items-center space-x-3">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944A11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-serif tracking-wide text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-gold-light)]">Privacy guaranteed.</span> We respect your data and will never share it.
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          {/* Divider with decorative element */}
          <div className="flex items-center my-10">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
            <div className="mx-5 relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full blur-md opacity-20"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/30 flex items-center justify-center relative z-10 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)]"></div>
              </div>
            </div>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
          </div>
          
          {/* Bottom section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="text-sm text-[var(--color-text-secondary)] font-serif tracking-wide">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)] font-medium">&copy; {new Date().getFullYear()}</span> Drift Travel Planning. <span className="italic">All rights reserved.</span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 justify-start md:justify-end">
              <a href="#" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors font-serif tracking-wide relative group">
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] group-hover:w-full transition-all duration-300"></span>
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors font-serif tracking-wide relative group">
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] group-hover:w-full transition-all duration-300"></span>
                Terms of Service
              </a>
              <a href="#" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-gold-light)] transition-colors font-serif tracking-wide relative group">
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] group-hover:w-full transition-all duration-300"></span>
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

    {/* Flight Details Modal */}
    <FlightDetailsModal 
      flight={selectedFlight}
      isOpen={showFlightModal}
      onClose={closeFlightModal}
    />
  </div>
);
};

export default HereNowPlanner;