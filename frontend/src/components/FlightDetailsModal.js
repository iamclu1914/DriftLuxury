import React from 'react';

const FlightDetailsModal = ({ flight, onClose, isOpen }) => {
  if (!isOpen || !flight) return null;

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    // Convert duration from minutes or format if already formatted
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAirlineIcon = (airlineCode) => {
    // Common airline icons - you can expand this
    const airlineIcons = {
      'AA': '🦅', 'UA': '🌐', 'DL': '🔺', 'SW': '💙',
      'BA': '🇬🇧', 'LH': '🦅', 'AF': '🇫🇷', 'KL': '🇳🇱',
      'SQ': '🇸🇬', 'EK': '🇦🇪', 'QR': '🇶🇦', 'TK': '🇹🇷'
    };
    return airlineIcons[airlineCode] || '✈️';
  };

  const renderSegment = (segment, index) => (
    <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 flex items-center space-x-2">
          <span>{getAirlineIcon(segment.carrierCode)}</span>
          <span>{segment.carrierCode} {segment.number}</span>
        </h4>
        <div className="text-sm text-gray-600">
          {segment.aircraft?.code && `${segment.aircraft.code}`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Departure */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {formatTime(segment.departure?.at)}
          </div>
          <div className="text-sm text-gray-600">
            {formatDate(segment.departure?.at)}
          </div>
          <div className="text-lg font-semibold text-gray-700 mt-1">
            {segment.departure?.iataCode}
          </div>
          <div className="text-xs text-gray-500">
            Terminal {segment.departure?.terminal || 'TBD'}
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {formatTime(segment.arrival?.at)}
          </div>
          <div className="text-sm text-gray-600">
            {formatDate(segment.arrival?.at)}
          </div>
          <div className="text-lg font-semibold text-gray-700 mt-1">
            {segment.arrival?.iataCode}
          </div>
          <div className="text-xs text-gray-500">
            Terminal {segment.arrival?.terminal || 'TBD'}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
        <span>Duration: {formatDuration(segment.duration)}</span>
        {segment.stops && segment.stops > 0 && (
          <span>• {segment.stops} stop{segment.stops > 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <span>✈️</span>
                <span>Flight Details</span>
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{flight.source || 'Direct Booking'}</span>
                <span>•</span>
                <span>{flight.travelerPricings?.length || 1} Passenger{(flight.travelerPricings?.length || 1) > 1 ? 's' : ''}</span>
                {flight.validatingAirlineCodes && (
                  <>
                    <span>•</span>
                    <span>Operated by {flight.validatingAirlineCodes.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 text-2xl hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Price Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-800">Price Breakdown</h4>
              <div className="text-3xl font-bold text-green-600">
                {flight.price?.currency} {flight.price?.total}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-700">Base Price</div>
                <div className="text-lg text-gray-900">
                  {flight.price?.currency} {flight.price?.base || 'N/A'}
                </div>
              </div>
              
              {flight.price?.fees && flight.price.fees.length > 0 && (
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-700">Fees & Taxes</div>
                  <div className="text-lg text-gray-900">
                    {flight.price.currency} {flight.price.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0)}
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="font-semibold text-gray-700">Total Price</div>
                <div className="text-lg font-bold text-green-600">
                  {flight.price?.currency} {flight.price?.total}
                </div>
              </div>
            </div>
          </div>

          {/* Flight Segments */}
          <div>
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🛫</span>
              <span>Flight Itinerary</span>
            </h4>
            
            <div className="space-y-6">
              {flight.itineraries?.map((itinerary, itinIndex) => (
                <div key={itinIndex} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-gray-800">
                      {itinIndex === 0 ? 'Outbound Flight' : 'Return Flight'}
                    </h5>
                    <div className="text-sm text-gray-600">
                      Total Duration: {formatDuration(itinerary.duration)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {itinerary.segments?.map((segment, segIndex) => (
                      <div key={segIndex}>
                        {renderSegment(segment, segIndex)}
                        
                        {/* Layover info */}
                        {segIndex < itinerary.segments.length - 1 && (
                          <div className="flex items-center justify-center py-3">
                            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
                              ⏱️ Layover in {itinerary.segments[segIndex].arrival.iataCode}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Class */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <span>🎫</span>
                <span>Booking Class</span>
              </h5>
              {flight.travelerPricings?.map((pricing, index) => (
                <div key={index} className="mb-2">
                  <div className="text-sm text-gray-600">
                    Passenger {index + 1}: 
                    <span className="font-medium ml-1">
                      {pricing.fareDetailsBySegment?.[0]?.cabin || 'Economy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Baggage */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <span>🧳</span>
                <span>Baggage Info</span>
              </h5>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Carry-on: Included</div>
                <div>Checked bag: See airline policy</div>
                <div className="text-xs mt-2 text-gray-500">
                  Baggage policies vary by airline
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => {
                // You can add booking logic here
                window.open(flight.bookingUrl || '#', '_blank');
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Book This Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsModal;