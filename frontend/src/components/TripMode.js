import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AirportAutocomplete from './AirportAutocomplete';
import FlightDetailsModal from './FlightDetailsModal';
import EnhancedItinerary from './EnhancedItinerary';
import './styles.css';
import { Link } from 'react-router-dom';

const TripMode = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    travelClass: 'ECONOMY',
    maxStops: 'any'
  });
  const [tripType, setTripType] = useState('roundtrip');
  const [flightResults, setFlightResults] = useState([]);
  const [loading, setLoading] = useState({ flights: false, plan: false });
  const [error, setError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [tripPlanResults, setTripPlanResults] = useState(null);
  const [resolvedCodes, setResolvedCodes] = useState({ origin: '', destination: '' });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;


  
  // Helper: resolve a user string to a 3-letter airport IATA code using backend endpoint
  const resolveAirportCode = async (input) => {
    if (!input) return null;
    const cleaned = input.trim().toUpperCase();
    if (cleaned.length === 3 && /^[A-Z]{3}$/.test(cleaned)) {
      return cleaned;
    }
    try {
      const res = await axios.get(`${API}/locations/airports`, {
        params: { keyword: input.trim() }
      });
      const airports = res.data?.airports || [];
      if (airports.length > 0 && airports[0].iataCode) {
        return airports[0].iataCode.toUpperCase();
      }
    } catch (err) {
      console.error('Airport resolve error:', err);
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchFlights = async () => {
    setLoading(prev => ({ ...prev, flights: true }));
    setError(null);

    // Ensure we have IATA codes
    const originCode = resolvedCodes.origin;
    const destCode = resolvedCodes.destination;

    if (!originCode || !destCode) {
      setError('Could not resolve one or both locations to airport codes. Please refine your input.');
      setLoading(prev => ({ ...prev, flights: false }));
      return;
    }

    // Sync resolved codes to state
    setSearchData(prev => ({ ...prev, origin: searchData.origin, destination: searchData.destination }));
    setResolvedCodes({ origin: originCode, destination: destCode });

    if (!searchData.departureDate) {
      setError('Please select a departure date.');
      setLoading(prev => ({ ...prev, flights: false }));
      return;
    }
    
    if (tripType === 'roundtrip' && !searchData.returnDate) {
      setError('Please select a return date for round-trip flights.');
      setLoading(prev => ({ ...prev, flights: false }));
      return;
    }
    
    try {
      // Detect user currency based on browser locale (simple mapping)
      const getUserCurrency = () => {
        try {
          const locale = navigator.language || 'en-US';
          const region = locale.split('-')[1];
          const mapping = {
            US: 'USD',
            GB: 'GBP',
            CA: 'CAD',
            AU: 'AUD',
            NZ: 'NZD',
            JP: 'JPY',
            CN: 'CNY',
            HK: 'HKD',
            SG: 'SGD',
            KR: 'KRW',
            IN: 'INR',
            EU: 'EUR',
            DE: 'EUR',
            FR: 'EUR',
            ES: 'EUR',
            IT: 'EUR',
            NL: 'EUR',
            BE: 'EUR',
            CH: 'CHF'
          };
          return mapping[region] || 'USD';
        } catch (err) {
          return 'USD';
        }
      };

      const userCurrency = getUserCurrency();

      const searchParams = {
        origin: originCode,
        destination: destCode,
        departureDate: searchData.departureDate,
        returnDate: tripType === 'roundtrip' ? searchData.returnDate : undefined,
        adults: searchData.adults,
        children: searchData.children,
        travelClass: searchData.travelClass,
        tripType: tripType,
        currency: userCurrency,
        maxStops: searchData.maxStops !== 'any' ? parseInt(searchData.maxStops) : undefined
      };

      const response = await axios.post(`${API}/flights/search-smart`, searchParams);
      
      if (response.data.success) {
        setFlightResults(response.data.flights);
        setActiveTab('compare');
      } else {
        setError('Flight search was not successful');
      }
    } catch (err) {
      console.error('Flight search error:', err);
      let errorMessage = 'Failed to search flights';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid search parameters. Please check your dates and locations.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Service temporarily unavailable. Please try again with dates in July 2025 or later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, flights: false }));
    }
  };

  const planTrip = async () => {
    setLoading(prev => ({ ...prev, plan: true }));
    setError(null);
    
    try {
      const tripData = {
        destination: searchData.destination,
        departure_date: searchData.departureDate,
        return_date: searchData.returnDate,
        budget: 2000,
        travelers: {
          adults: searchData.adults,
          children: searchData.children
        },
        preferences: {
          sustainability_mode: true,
          mood_based_suggestions: true,
          local_insights: true,
          budget_intelligence: true
        }
      };

      const response = await axios.post(`${API}/trip/plan-and-book`, tripData);
      
      if (response.data.success) {
        setTripPlanResults(response.data);
        setActiveTab('plan');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to plan trip');
    } finally {
      setLoading(prev => ({ ...prev, plan: false }));
    }
  };

  const handleFlightClick = (flight) => {
    setSelectedFlight(flight);
    setShowFlightModal(true);
  };

  const closeFlightModal = () => {
    setShowFlightModal(false);
    setSelectedFlight(null);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return typeof price === 'object' ? `${price.currency} ${price.total}` : price;
  };

  const formatDuration = (isoDuration) => {
    if (!isoDuration) return 'N/A';
    
    // Extract hours and minutes from PT#H#M format
    const hourMatch = isoDuration.match(/([0-9]+)H/);
    const minuteMatch = isoDuration.match(/([0-9]+)M/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    if (hours === 0 && minutes === 0) return 'N/A';
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    
    return `${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: 'search', label: 'Search Flights' },
    { id: 'compare', label: 'Compare Results', disabled: flightResults.length === 0 },
    { id: 'plan', label: 'Trip Planning' }
  ];

  return (
    <div className="TripMode-container min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-[var(--color-text)] font-serif">
      
      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 md:py-10">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 relative">
          {/* Decorative background elements */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-[128px] opacity-20 animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-[128px] opacity-10 animate-pulse-slow" style={{animationDelay: '2.5s'}}></div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight leading-tight mb-3 sm:mb-4 md:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Luxury</span> Flight Experience
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base sm:text-lg md:text-xl font-serif tracking-wide leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto">
            Discover premium flight options and plan your journey with AI-powered recommendations
          </p>
        </div>

        {/* Tab Navigation with Luxury Styling */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="glassmorphism rounded-xl sm:rounded-2xl border border-gray-700/30 shadow-xl p-1 sm:p-2">
            <div className="flex space-x-1 sm:space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`flex-1 py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 rounded-lg sm:rounded-xl font-serif font-medium text-sm sm:text-base md:text-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 shadow-lg'
                      : tab.disabled
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:bg-gray-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="glassmorphism rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-700/30 p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
            
            {/* Trip Type Selector */}
            <div className="mb-5 sm:mb-8 relative z-10">
              <div className="flex justify-center space-x-3 sm:space-x-6">
                <button
                  onClick={() => setTripType('roundtrip')}
                  className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-serif font-medium text-sm sm:text-base md:text-lg transition-all duration-300 ${
                    tripType === 'roundtrip'
                      ? 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 shadow-lg'
                      : 'bg-gray-800/50 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] border border-gray-700/30'
                  }`}
                >
                  Round Trip
                </button>
                <button
                  onClick={() => setTripType('oneway')}
                  className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-serif font-medium text-sm sm:text-base md:text-lg transition-all duration-300 ${
                    tripType === 'oneway'
                      ? 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 shadow-lg'
                      : 'bg-gray-800/50 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] border border-gray-700/30'
                  }`}
                >
                  One Way
                </button>
              </div>
            </div>

            {/* Flight Search Form */}
            <div className="space-y-8 relative z-10">
              {/* Form Header */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-semibold tracking-tight text-[var(--color-text)] mb-2 sm:mb-3 md:mb-4 leading-tight">Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Perfect</span> Flight</h3>
                <p className="text-[var(--color-text-secondary)] font-serif text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">Enter your travel details for a tailored luxury experience</p>
              </div>
              
              {/* Origin and Destination (Airport Codes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">From</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                      </svg>
                    </div>
                    <AirportAutocomplete
                      name="origin"
                      value={searchData.origin}
                      onChange={handleInputChange}
                      onAirportSelect={(code, display) => setResolvedCodes(prev => ({ ...prev, origin: code }))}
                      label=""
                      placeholder="Enter city or airport"
                      required
                      className="block w-full rounded-xl py-3.5 px-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner placeholder-gray-300/90"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">To</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <AirportAutocomplete
                      name="destination"
                      value={searchData.destination}
                      onChange={handleInputChange}
                      onAirportSelect={(code, display) => setResolvedCodes(prev => ({ ...prev, destination: code }))}
                      label=""
                      placeholder="Enter city or airport"
                      required
                      className="block w-full rounded-xl py-3.5 px-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner placeholder-gray-300/90"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Departure Date
                  </label>
                  <div className="relative cursor-pointer">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div 
                      className="absolute inset-0 z-10"
                      onClick={() => {
                        // This transparent overlay captures clicks anywhere in the container
                        const inputElement = document.querySelector('input[name="departureDate"]');
                        if (inputElement) {
                          inputElement.showPicker();
                        }
                      }}
                    ></div>
                    <input
                      type="date"
                      name="departureDate"
                      value={searchData.departureDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="block w-full rounded-xl py-3.5 px-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Return Date {tripType === 'oneway' && <span className="text-xs sm:text-sm text-gray-400">(Optional)</span>}
                  </label>
                  <div className="relative cursor-pointer">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    {tripType !== 'oneway' && (
                      <div 
                        className="absolute inset-0 z-10"
                        onClick={() => {
                          // This transparent overlay captures clicks anywhere in the container
                          const inputElement = document.querySelector('input[name="returnDate"]');
                          if (inputElement && !inputElement.disabled) {
                            inputElement.showPicker();
                          }
                        }}
                      ></div>
                    )}
                    <input
                      type="date"
                      name="returnDate"
                      value={searchData.returnDate}
                      onChange={handleInputChange}
                      disabled={tripType === 'oneway'}
                      min={searchData.departureDate || new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="block w-full rounded-xl py-3.5 px-4 pl-12 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner disabled:bg-gray-900/50 disabled:text-gray-400 disabled:cursor-not-allowed"
                      required={tripType === 'roundtrip'}
                    />
                  </div>
                </div>
              </div>

              {/* Passengers, Class and Stops */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Adults
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <select
                      name="adults"
                      value={searchData.adults}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3.5 px-4 pl-12 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner appearance-none"
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Children
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                    </div>
                    <select
                      name="children"
                      value={searchData.children}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3.5 px-4 pl-12 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner appearance-none"
                    >
                      {[0,1,2,3,4].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Class
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                      </svg>
                    </div>
                    <select
                      name="travelClass"
                      value={searchData.travelClass}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3.5 px-4 pl-12 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner appearance-none"
                    >
                      <option value="ECONOMY">Economy</option>
                      <option value="PREMIUM_ECONOMY">Premium Economy</option>
                      <option value="BUSINESS">Business</option>
                      <option value="FIRST">First Class</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 sm:mb-2 md:mb-3 text-white font-serif text-sm sm:text-base md:text-lg font-medium tracking-wide">
                    Max Stops
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    <select
                      name="maxStops"
                      value={searchData.maxStops}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 md:py-3.5 px-4 pl-12 text-sm sm:text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)] bg-gray-800/80 border border-gray-700/50 text-white shadow-inner appearance-none"
                    >
                      <option value="any">Any number of stops</option>
                      <option value="0">Non-stop flights only</option>
                      <option value="1">Max 1 stop</option>
                      <option value="2">Max 2 stops</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Buttons */}
              <div className="space-y-4 sm:space-y-5 md:space-y-6 pt-3 sm:pt-4 md:pt-6">
                <button
                  onClick={searchFlights}
                  disabled={loading.flights || !resolvedCodes.origin || !resolvedCodes.destination || !searchData.departureDate}
                  className="w-full py-3 sm:py-4 md:py-5 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] hover:from-[var(--color-gold)] hover:to-[var(--color-gold-light)] text-gray-900 font-serif font-medium text-base sm:text-lg md:text-xl rounded-lg sm:rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.flights ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching for Luxury Options...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      <span>Discover Premium Flights</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={planTrip}
                  disabled={loading.plan || !searchData.destination}
                  className="w-full py-5 bg-gray-800/80 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-xl text-lg font-serif font-medium hover:bg-gray-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  {loading.plan ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-[var(--color-gold)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Your Luxury Experience...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      <span>Plan Full Trip with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab - Flight Results with Luxury Styling */}
        {activeTab === 'compare' && (
          <div className="glassmorphism rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-700/30 p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
            
            {flightResults.length > 0 ? (
              <div className="space-y-4 relative z-10">
                <div className="text-center mb-4">
                  <h3 className="text-xl sm:text-2xl font-serif font-semibold tracking-tight text-[var(--color-text)] mb-2 leading-tight">Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Luxury</span> Flights ({flightResults.length})</h3>
                  <p className="text-[var(--color-text-secondary)] font-serif text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">Select a flight to view details</p>
                </div>
                
                {flightResults.map((flight, index) => (
                  <div 
                    key={index} 
                    className="glassmorphism-card rounded-xl p-3 sm:p-4 border border-gray-700/30 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-[var(--color-gold)] group relative overflow-hidden"
                    onClick={() => handleFlightClick(flight)}
                  >
                    {/* Gold accent line */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--color-gold-light)] to-[var(--color-gold)] group-hover:w-2 transition-all duration-300"></div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3 pl-2">
                      <div>
                        <h4 className="font-serif font-semibold text-[var(--color-text)] text-base sm:text-lg tracking-tight">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">{flight.source || 'Direct Booking'}</span>
                        </h4>
                        <p className="text-[var(--color-text-secondary)] font-serif mt-1 flex items-center">
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-800/60 mr-2 border border-gray-700/40">
                            <svg className="h-3 w-3 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                            </svg>
                          </span>
                          {flight.validatingAirlineCodes?.join(', ') || 'Multiple Airlines'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-serif font-semibold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
                          {/* Convert to USD if not already */}
                          USD {typeof flight.price === 'string' ? flight.price : (flight.price?.total ? parseFloat(flight.price.total).toFixed(2) : '0.00')}
                        </div>
                        <p className="text-[var(--color-text-secondary)] font-serif mt-1">
                          per person
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm pl-2 mb-2 sm:mb-3">
                      {flight.itineraries?.map((itinerary, itinIndex) => (
                        <div key={itinIndex} className="glassmorphism-card p-2 sm:p-3 rounded-lg">
                          <div className="text-[var(--color-gold)] font-serif font-medium mb-2 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {itinIndex === 0 ? 'Outbound' : 'Return'}
                          </div>
                          {itinerary.segments && itinerary.segments.length > 0 && (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-center">
                                  <div className="font-serif text-[var(--color-text)] text-sm sm:text-base">{itinerary.segments[0].departure?.iataCode}</div>
                                  <div className="text-[var(--color-text-secondary)] text-xs">
                                    {itinerary.segments[0].departure?.at ? new Date(itinerary.segments[0].departure.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                                  </div>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="text-[var(--color-gold)] text-xs mb-1">{formatDuration(itinerary.duration)}</div>
                                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"></div>
                                  <div className="text-[var(--color-text-secondary)] text-xs mt-1">{itinerary.segments.length > 1 ? `${itinerary.segments.length-1} stop${itinerary.segments.length > 2 ? 's' : ''}` : 'Direct'}</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-serif text-[var(--color-text)] text-sm sm:text-base">{itinerary.segments[itinerary.segments.length - 1].arrival?.iataCode}</div>
                                  <div className="text-[var(--color-text-secondary)] text-xs">
                                    {itinerary.segments[itinerary.segments.length - 1].arrival?.at ? new Date(itinerary.segments[itinerary.segments.length - 1].arrival.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[var(--color-text-secondary)] font-serif text-xs mt-2 flex items-center">
                                <svg className="h-3 w-3 mr-1 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {formatDuration(itinerary.duration)}
                                {itinerary.segments[0].carrierCode && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-800/40 rounded-full border border-gray-700/30">
                                    {itinerary.segments[0].carrierCode}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-700/20 pl-2">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-800/80 flex items-center justify-center mr-2 border border-gray-700/50">
                          <svg className="h-4 w-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                        <span className="text-[var(--color-text-secondary)] font-serif">{flight.travelerPricings?.length || 1} passenger{(flight.travelerPricings?.length || 1) > 1 ? 's' : ''}</span>
                        <div className="ml-auto">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlightClick(flight);
                            }}
                            className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 font-medium cursor-pointer hover:shadow-md transition-all hover:scale-105 flex items-center"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  No Flight Results Yet
                </h3>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Search for flights using the search tab to see available options here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="glassmorphism rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-700/30 p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
            
            {/* Trip Planning Results */}
            {tripPlanResults ? (
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-[var(--color-text)] mb-4 leading-tight">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Luxury</span> Trip Plan</h3>
                  <p className="text-[var(--color-text-secondary)] font-serif text-base sm:text-lg font-light leading-relaxed max-w-2xl mx-auto">Curated exclusively for your journey</p>
                </div>
                
                <EnhancedItinerary 
                  itinerary={tripPlanResults.itinerary} 
                  nearbyPlaces={tripPlanResults.places || tripPlanResults.nearby_places} 
                />
              </div>
            ) : (
              <div className="text-center relative z-10">
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-[var(--color-text)] mb-4 leading-tight">Plan Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">Luxury</span> Trip</h3>
                  <p className="text-[var(--color-text-secondary)] font-serif text-base sm:text-lg font-light leading-relaxed mb-8">
                    Search for flights first, then use our AI to plan your entire trip including premium accommodations, exclusive activities, and fine dining recommendations.
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-8 py-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] hover:from-[var(--color-gold)] hover:to-[var(--color-gold-light)] text-gray-900 font-serif font-medium text-lg rounded-xl shadow-lg transition-all"
                  >
                    Start by Searching Flights
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display with Luxury Styling */}
        {error && (
          <div className="fixed bottom-6 right-6 glassmorphism px-6 py-4 rounded-xl shadow-xl border border-gray-700/30 z-50 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-serif font-medium text-[var(--color-gold)]">Error</h4>
                <p className="text-sm text-[var(--color-text-secondary)] font-serif">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] text-xl ml-4 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Flight Details Modal - styling will be handled in the FlightDetailsModal component */}
        <FlightDetailsModal 
          flight={selectedFlight}
          isOpen={showFlightModal}
          onClose={closeFlightModal}
        />
      </div>
    </div>
  );
};

export default TripMode;
