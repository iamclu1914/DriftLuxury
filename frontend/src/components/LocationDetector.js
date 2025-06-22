import React, { useState, useEffect } from 'react';

const LocationDetector = ({ onLocationDetected, onError }) => {
  const [detecting, setDetecting] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      onError('Geolocation is not supported by this browser');
      return;
    }

    setDetecting(true);
    setLocationDenied(false);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const city = data.city || data.locality || 'Unknown Location';
          const country = data.countryName || '';
          const location = country ? `${city}, ${country}` : city;
          
          onLocationDetected(location, { latitude, longitude });
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          onLocationDetected(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, { latitude, longitude });
        }
        
        setDetecting(false);
      },
      (error) => {
        setDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDenied(true);
        }
        onError(error.message);
      },
      options
    );
  };

  return (
    <div className="location-detector">
      <button
        onClick={detectLocation}
        disabled={detecting}
        className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {detecting ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Detecting...</span>
          </>
        ) : (
          <>
            <span className="text-lg">📍</span>
            <span className="text-sm font-medium">Use My Location</span>
          </>
        )}
      </button>
      
      {locationDenied && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200">
          <span className="font-medium">💡 Tip:</span> Enable location access for personalized recommendations
        </div>
      )}
    </div>
  );
};

export default LocationDetector;