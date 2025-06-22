import React from 'react';

const FlightDetailsModal = ({ flight, onClose, isOpen }) => {
  if (!isOpen || !flight) return null;

  // Format duration from ISO 8601 duration string to human-readable format
  const formatDuration = (isoDuration) => {
    if (!isoDuration) return 'N/A';
    const hourMatch = isoDuration.match(/([0-9]+)H/);
    const minuteMatch = isoDuration.match(/([0-9]+)M/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    if (hours === 0 && minutes === 0) return 'N/A';
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Format time from ISO datetime string to localized time
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Format date from ISO datetime string to localized date
  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate layover duration between segments
  const calculateLayoverDuration = (arrivalTime, departureTime) => {
    if (!arrivalTime || !departureTime) return 'PT0H0M';
    try {
      const arrival = new Date(arrivalTime);
      const departure = new Date(departureTime);
      const durationMs = departure - arrival;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `PT${hours}H${minutes}M`;
    } catch (e) {
      return 'PT0H0M';
    }
  };

  // Get airline name from carrier code
  const getAirlineName = (airlineCode) => {
    if (!airlineCode) return 'Unknown Airline';
    
    const airlineMap = {
      'AA': 'American Airlines',
      'DL': 'Delta Air Lines',
      'UA': 'United Airlines',
      'LH': 'Lufthansa',
      'BA': 'British Airways',
      'AF': 'Air France',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'SQ': 'Singapore Airlines',
      'CX': 'Cathay Pacific',
      'EY': 'Etihad Airways',
      'TK': 'Turkish Airlines',
      'KL': 'KLM Royal Dutch Airlines',
      'JL': 'Japan Airlines',
      'NH': 'All Nippon Airways',
      'QF': 'Qantas',
      'VS': 'Virgin Atlantic',
      'AC': 'Air Canada',
      'IB': 'Iberia',
      'AY': 'Finnair',
    };
    
    return airlineMap[airlineCode] || `${airlineCode} Airlines`;
  };
  
  // Render flight segment
  const renderSegment = (segment, index) => (
    <div className="glassmorphism-card bg-white/10 backdrop-blur-md rounded-xl p-2 space-y-2 border border-white/20">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-xs text-white flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center border border-white/30">
            <img 
              src={`https://www.gstatic.com/flights/airline_logos/70px/${segment.carrierCode}.png`} 
              alt={segment.carrierCode}
              className="h-4 w-4"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/70?text=Airline'; }}
            />
          </div>
          <div>
            <span className="font-medium text-xs text-white">{getAirlineName(segment.carrierCode)}</span>
            <div className="text-xs text-white">
              {segment.carrierCode} {segment.number}
              {segment.aircraft?.code && <span className="ml-2">• {segment.aircraft.code}</span>}
            </div>
          </div>
        </h4>
        <div className="px-2 py-1 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 text-xs font-medium">
          {formatDuration(segment.duration)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Departure */}
        <div className="text-center relative">
          <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent -z-10 transform -translate-y-1/2"></div>
          <div className="text-base font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
            {formatTime(segment.departure?.at)}
          </div>
          <div className="text-xs font-serif text-white mt-1">
            {formatDate(segment.departure?.at)}
          </div>
          <div className="text-sm font-serif font-semibold text-white mt-1">
            {segment.departure?.iataCode}
          </div>
          <div className="text-xs text-white mt-1 font-serif">
            Terminal {segment.departure?.terminal || 'TBD'}
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center">
          <div className="text-base font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
            {formatTime(segment.arrival?.at)}
          </div>
          <div className="text-xs font-serif text-white mt-1">
            {formatDate(segment.arrival?.at)}
          </div>
          <div className="text-sm font-serif font-semibold text-white mt-1">
            {segment.arrival?.iataCode}
          </div>
          <div className="text-xs text-white mt-1 font-serif">
            Terminal {segment.arrival?.terminal || 'TBD'}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-2 text-xs text-white font-serif pt-1">
        {segment.stops && segment.stops > 0 && (
          <span className="flex items-center px-2 py-0.5 bg-white/15 rounded-full">
            <svg className="h-3 w-3 mr-1 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            {segment.stops} stop{segment.stops > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-3 z-50" onClick={onClose}>
      <div className="glassmorphism-card bg-black/40 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="p-3 border-b border-white/20 bg-gradient-to-r from-black/50 to-gray-900/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)] mb-1 flex items-center space-x-2">
                <svg className="h-4 w-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z"></path>
                </svg>
                <span>Flight Details</span>
              </h3>
              <div className="flex items-center space-x-3 text-xs text-white font-serif">
                <span>{flight.source || 'Direct Booking'}</span>
                <span>•</span>
                <span>{flight.travelerPricings?.length || 1} Passenger{(flight.travelerPricings?.length || 1) > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-[var(--color-gold)] transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Price & Booking */}
        <div className="mt-2 flex items-center justify-between glassmorphism-card bg-white/10 backdrop-blur-md rounded-lg p-2 mx-3 border border-white/20">
          <div>
            <div className="text-xs text-white font-serif">Total Price</div>
            <div className="text-base font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
              {flight.price ? `$${typeof flight.price === 'object' ? parseFloat(flight.price.total).toFixed(2) : parseFloat(flight.price).toFixed(2)} USD` : 'Price unavailable'}
            </div>
          </div>
          
          <div className="text-xs text-white font-serif">
            {flight.validatingAirlineCodes?.length > 0 && (
              <div className="flex flex-col items-end">
                <span>Operated by</span>
                <span className="font-medium text-white">
                  {getAirlineName(flight.validatingAirlineCodes[0])}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="p-3 space-y-3">

          {/* Flight Itinerary */}
          <div className="p-3 space-y-3">
            <h4 className="font-serif text-sm font-semibold text-white flex items-center space-x-2">
              <svg className="h-4 w-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
              <span>Flight Itinerary</span>
            </h4>
            
            <div className="space-y-3">
              {flight.itineraries?.map((itinerary, idx) => (
                <div key={idx} className="space-y-3">
                  {/* Itinerary Header */}
                  <div className="flex justify-between items-center">
                    <div className="font-serif text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
                      {idx === 0 ? 'Outbound' : 'Return'}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] font-serif">
                      {formatDuration(itinerary.duration)}
                    </div>
                  </div>
                  
                  {/* Segments */}
                  <div className="space-y-3">
                    {itinerary.segments?.map((segment, segIdx) => (
                      <div key={segIdx}>
                        {/* Segment */}
                        {renderSegment(segment, segIdx)}
                        
                        {/* Layover */}
                        {segIdx < itinerary.segments.length - 1 && (
                          <div className="flex items-center justify-center py-2">
                            <div className="px-3 py-1 rounded-full bg-white/15 border border-white/30 text-xs text-white/90 font-serif flex items-center">
                              <svg className="h-3 w-3 mr-1 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Layover: {formatDuration(calculateLayoverDuration(
                                segment.arrival?.at,
                                itinerary.segments[segIdx + 1].departure?.at
                              ))}
                              <span className="ml-2 font-medium text-white">{segment.arrival?.iataCode}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Booking Class */}
            <div className="glassmorphism-card bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <h5 className="font-serif text-xs font-semibold text-white mb-1 flex items-center space-x-2">
                <svg className="h-3 w-3 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                </svg>
                <span>Booking Class</span>
              </h5>
              {flight.travelerPricings?.map((pricing, index) => (
                <div key={index} className="mb-1">
                  <div className="text-xs text-white font-serif">
                    Passenger {index + 1}: 
                    <span className="font-medium ml-1 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-light)] to-[var(--color-gold)]">
                      {pricing.fareDetailsBySegment?.[0]?.cabin || 'Economy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Baggage */}
            <div className="glassmorphism-card bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <h5 className="font-serif text-xs font-semibold text-white mb-1 flex items-center space-x-2">
                <svg className="h-3 w-3 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>Baggage Info</span>
              </h5>
              <div className="text-xs text-white font-serif space-y-1">
                <div className="flex items-center">
                  <svg className="h-3 w-3 mr-1 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Carry-on: Included</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-3 w-3 mr-1 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Checked bag: See airline policy</span>
                </div>
                <div className="text-xs mt-1 text-white italic">
                  Baggage policies vary by airline
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-3 border-t border-white/20 flex justify-between items-center">
            <button 
              onClick={onClose}
              className="px-3 py-1 text-xs text-white hover:text-[var(--color-gold)] transition-colors font-serif flex items-center space-x-1"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close</span>
            </button>
            
            <button 
              onClick={() => {
                window.open(flight.bookingUrl || '#', '_blank');
              }}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-gray-900 text-xs font-medium font-serif flex items-center space-x-1.5 hover:shadow-lg hover:shadow-[var(--color-gold)]/30 transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Book This Flight</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsModal;