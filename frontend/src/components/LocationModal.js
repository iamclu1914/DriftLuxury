import React from 'react';

const LocationModal = ({ isOpen, onClose, location }) => {
  if (!isOpen || !location) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-amber-700 text-white p-8 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-amber-400/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">📍</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{location.title}</h2>
                <div className="flex items-center space-x-2 text-amber-100">
                  <span className="capitalize font-medium">{location.category}</span>
                  <span>•</span>
                  <span>{location.duration_minutes} minutes</span>
                  <span>•</span>
                  <span className="font-semibold">{location.estimated_cost}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="text-2xl mr-3">📝</span>
              Experience Overview
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {location.description}
            </p>
          </div>

          {/* Location Details */}
          {location.place_details && (
            <div className="space-y-6">
              {/* Address */}
              {location.place_details.address && (
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <span className="text-xl mr-2">🗺️</span>
                    Location
                  </h4>
                  <p className="text-slate-600 font-medium">{location.place_details.address}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rating */}
                {location.place_details.rating > 0 && (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                      <span className="text-xl mr-2">⭐</span>
                      Guest Rating
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xl ${i < Math.floor(location.place_details.rating) ? 'text-amber-400' : 'text-slate-200'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-amber-800">
                        {location.place_details.rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {/* Cost Estimate */}
                {location.place_details.cost_estimate && (
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center">
                      <span className="text-xl mr-2">💰</span>
                      Investment Level
                    </h4>
                    <p className="text-lg font-bold text-emerald-800">
                      {location.place_details.cost_estimate}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {location.place_details.phone && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                    <span className="text-xl mr-2">📞</span>
                    Contact Information
                  </h4>
                  <p className="text-blue-800 font-medium">{location.place_details.phone}</p>
                </div>
              )}

              {/* Photos Preview */}
              {location.place_details.photos && location.place_details.photos.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📸</span>
                    Visual Preview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {location.place_details.photos.slice(0, 3).map((photo, index) => (
                      <div key={index} className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                        <img 
                          src={photo} 
                          alt={`${location.title} view ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
              >
                Close Details
              </button>
              {location.place_details?.coordinates && (
                <button
                  onClick={() => {
                    const { lat, lng } = location.place_details.coordinates;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🗺️</span>
                    <span>View on Maps</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;