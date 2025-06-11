import React, { useState } from 'react';
import axios from 'axios';
import EnhancedItinerary from './EnhancedItinerary';
import LocationAutocomplete from './LocationAutocomplete';
import FlightDetailsModal from './FlightDetailsModal';

const TripMode = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    travelClass: 'ECONOMY'
  });
  const [tripType, setTripType] = useState('roundtrip');
  const [flightResults, setFlightResults] = useState([]);
  const [loading, setLoading] = useState({ flights: false, plan: false });
  const [error, setError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [tripPlanResults, setTripPlanResults] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

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
    
    if (!searchData.origin || !searchData.destination) {
      setError('Please enter both origin and destination airports or cities.');
      setLoading(prev => ({ ...prev, flights: false }));
      return;
    }
    
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
      const searchParams = {
        origin: searchData.origin,
        destination: searchData.destination,
        departureDate: searchData.departureDate,
        returnDate: tripType === 'roundtrip' ? searchData.returnDate : undefined,
        adults: searchData.adults,
        children: searchData.children,
        travelClass: searchData.travelClass,
        tripType: tripType
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

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return duration;
  };

  const tabs = [
    { id: 'search', label: 'Search Flights' },
    { id: 'compare', label: 'Compare Results', disabled: flightResults.length === 0 },
    { id: 'plan', label: 'Trip Planning' }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Flight Search
          </h1>
          <p className="text-xl text-gray-600">
            Find the perfect flights with AI-powered recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`flex-1 py-4 px-6 rounded-xl font-medium text-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-black text-white shadow-lg'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
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
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            {/* Trip Type Selector */}
            <div className="mb-8">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setTripType('roundtrip')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    tripType === 'roundtrip'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Round Trip
                </button>
                <button
                  onClick={() => setTripType('oneway')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    tripType === 'oneway'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  One Way
                </button>
              </div>
            </div>

            {/* Flight Search Form */}
            <div className="space-y-8">
              {/* Origin and Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LocationAutocomplete
                  name="origin"
                  value={searchData.origin}
                  onChange={handleInputChange}
                  placeholder="e.g., JFK, New York, NYC"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                  required
                  label="From"
                />
                
                <LocationAutocomplete
                  name="destination"
                  value={searchData.destination}
                  onChange={handleInputChange}
                  placeholder="e.g., LAX, Los Angeles, LA"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                  required
                  label="To"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-2">
                  <p className="text-sm text-gray-600">
                    For best results, select dates at least 2 weeks in the future (July 2025 or later recommended)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={searchData.departureDate}
                    onChange={handleInputChange}
                    min={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Return Date
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={searchData.returnDate}
                    onChange={handleInputChange}
                    disabled={tripType === 'oneway'}
                    min={searchData.departureDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required={tripType === 'roundtrip'}
                  />
                </div>
              </div>

              {/* Passengers and Class */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adults
                  </label>
                  <select
                    name="adults"
                    value={searchData.adults}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Children
                  </label>
                  <select
                    name="children"
                    value={searchData.children}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                  >
                    {[0,1,2,3,4].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    name="travelClass"
                    value={searchData.travelClass}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-black text-lg transition-all bg-white"
                  >
                    <option value="ECONOMY">Economy</option>
                    <option value="PREMIUM_ECONOMY">Premium Economy</option>
                    <option value="BUSINESS">Business</option>
                    <option value="FIRST">First Class</option>
                  </select>
                </div>
              </div>

              {/* Search Buttons */}
              <div className="space-y-4 pt-4">
                <button
                  onClick={searchFlights}
                  disabled={loading.flights || !searchData.origin || !searchData.destination}
                  className="w-full py-5 px-8 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading.flights ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Searching flights...</span>
                    </div>
                  ) : (
                    'Search Flights'
                  )}
                </button>
                
                <button
                  onClick={planTrip}
                  disabled={loading.plan || !searchData.destination}
                  className="w-full py-5 px-8 bg-white text-black border-2 border-black rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading.plan ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
                      <span>Planning trip...</span>
                    </div>
                  ) : (
                    'Plan Full Trip with AI'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab - Flight Results */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            {flightResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Available Flights ({flightResults.length})
                </h3>
                
                {flightResults.map((flight, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-black"
                    onClick={() => handleFlightClick(flight)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {flight.source || 'Direct Booking'}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {flight.validatingAirlineCodes?.join(', ') || 'Multiple Airlines'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          {formatPrice(flight.price)}
                        </div>
                        <p className="text-sm text-gray-500">per person</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {flight.itineraries?.map((itinerary, itinIndex) => (
                        <div key={itinIndex} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-700 mb-2">
                            {itinIndex === 0 ? 'Outbound' : 'Return'}
                          </div>
                          {itinerary.segments && itinerary.segments.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span>{itinerary.segments[0].departure?.iataCode}</span>
                              <span className="text-gray-400">→</span>
                              <span>{itinerary.segments[itinerary.segments.length - 1].arrival?.iataCode}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Duration: {formatDuration(itinerary.duration)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {flight.travelerPricings?.length || 1} passenger{(flight.travelerPricings?.length || 1) > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm font-medium text-black">
                        View Details →
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

        {/* Plan Tab - Trip Planning Results */}
        {activeTab === 'plan' && tripPlanResults && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Your Complete Trip Plan
                </h3>
                <p className="text-xl text-gray-600">
                  AI-powered itinerary with real places, activities, and local insights
                </p>
              </div>

              <EnhancedItinerary 
                itinerary={tripPlanResults.itinerary} 
                nearbyPlaces={tripPlanResults.places || tripPlanResults.nearby_places} 
              />
            </div>
          </div>
        )}

        {/* Plan Tab - No Results Yet */}
        {activeTab === 'plan' && !tripPlanResults && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Plan Your Trip?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Click the "Plan Full Trip with AI" button in the search tab to generate a complete itinerary.
            </p>
            <button
              onClick={() => setActiveTab('search')}
              className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-all"
            >
              Back to Search
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-black text-white px-6 py-4 rounded-xl shadow-lg z-50">
            <div className="flex items-center space-x-3">
              <div>
                <h4 className="font-bold">Error</h4>
                <p className="text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200 text-xl ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Flight Details Modal */}
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
