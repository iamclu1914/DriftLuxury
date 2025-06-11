// EnhancedItinerary.js - luxury styled itinerary display
import React, { useState, useEffect, useMemo } from 'react';

const EnhancedItinerary = ({ itinerary = {}, nearbyPlaces = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const categorizedPlaces = useMemo(() => {
    const categories = {
      restaurants: [],
      attractions: [],
      shopping: [],
      entertainment: [],
      all: nearbyPlaces,
    };

    nearbyPlaces.forEach((place) => {
      const types = place.types || [];
      const match = (arr) => types.some((t) => arr.includes(t));
      if (match(['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'])) categories.restaurants.push(place);
      else if (match(['tourist_attraction', 'museum', 'park', 'zoo', 'amusement_park'])) categories.attractions.push(place);
      else if (match(['shopping_mall', 'store', 'clothing_store'])) categories.shopping.push(place);
      else if (match(['movie_theater', 'night_club', 'casino'])) categories.entertainment.push(place);
    });
    return categories;
  }, [nearbyPlaces]);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋', count: itinerary?.activities?.length || 0 },
    { id: 'restaurants', label: 'Dining', icon: '🍽️', count: categorizedPlaces.restaurants.length },
    { id: 'attractions', label: 'Attractions', icon: '🎭', count: categorizedPlaces.attractions.length },
    { id: 'shopping', label: 'Shopping', icon: '🛍️', count: categorizedPlaces.shopping.length },
    { id: 'entertainment', label: 'Entertainment', icon: '🎪', count: categorizedPlaces.entertainment.length },
    { id: 'all', label: 'All', icon: '🗺️', count: nearbyPlaces.length },
  ];

  const getPlaceIcon = (types = []) => {
    const t = types[0];
    const map = {
      restaurant: '🍽️', food: '🍽️', cafe: '☕', bar: '🍺',
      tourist_attraction: '🎭', museum: '🏛️', park: '🌳', zoo: '🦁',
      shopping_mall: '🛍️', store: '🏪', clothing_store: '👗',
      movie_theater: '🎬', night_club: '🌃', casino: '🎰',
    };
    return map[t] || '📍';
  };

  /* ------------------------------------------------------------------ */
  /* Renderers                                                          */
  /* ------------------------------------------------------------------ */
  const renderOverview = () => {
    if (!itinerary.activities?.length) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-[var(--color-text-secondary)] text-lg">No activities generated yet</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {itinerary.narrative_summary && (
          <div className="glassmorphism p-6 rounded-xl border border-gray-700/50">
            <p className="font-serif text-[var(--color-text)] text-lg leading-relaxed">{itinerary.narrative_summary}</p>
            {itinerary.total_estimated_cost && (
              <div className="mt-4 inline-block bg-[var(--color-gold-dark)]/10 text-[var(--color-gold)] px-3 py-1 rounded-full text-sm font-medium">
                💰 {itinerary.total_estimated_cost}
              </div>
            )}
          </div>
        )}
        {itinerary.activities.map((a, idx) => (
          <div key={idx} className="glassmorphism p-6 rounded-xl border border-gray-700/50 flex space-x-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold)] text-white font-bold">{idx + 1}</div>
            <div className="flex-1">
              <h5 className="font-serif text-xl text-[var(--color-text)] mb-2">{a.title}</h5>
              <p className="text-[var(--color-text-secondary)] mb-3">{a.description}</p>
              <div className="flex flex-wrap gap-2 text-sm font-medium">
                <span className="bg-gray-800/50 px-2 py-1 rounded">📍 {a.location}</span>
                <span className="bg-gray-800/50 px-2 py-1 rounded">⏱️ {a.duration_minutes} min</span>
                <span className="bg-gray-800/50 px-2 py-1 rounded">💰 {a.estimated_cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPlaces = (places) => {
    if (!places.length) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-[var(--color-text-secondary)] text-lg">No places found</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.map((p, i) => (
          <div key={p.place_id || `${p.name}-${i}`}
               onClick={() => { setSelectedPlace(p); setIsModalOpen(true); }}
               className="glassmorphism p-4 rounded-xl border border-gray-700/50 hover:shadow-modern-lg transition-all cursor-pointer">
            <div className="w-full h-32 bg-gray-800/40 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              {p.photos?.[0]?.url ? (
                <img src={p.photos[0].url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{getPlaceIcon(p.types)}</span>
              )}
            </div>
            <h5 className="font-serif text-lg text-[var(--color-text)] mb-1 line-clamp-2">{p.name}</h5>
            <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-2">{p.formatted_address || p.vicinity || p.address || 'Address not available'}</p>
            {p.rating && (
              <div className="bg-yellow-100/10 text-yellow-400 inline-block px-2 py-0.5 rounded text-sm">⭐ {p.rating}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'restaurants':
        return renderPlaces(categorizedPlaces.restaurants);
      case 'attractions':
        return renderPlaces(categorizedPlaces.attractions);
      case 'shopping':
        return renderPlaces(categorizedPlaces.shopping);
      case 'entertainment':
        return renderPlaces(categorizedPlaces.entertainment);
      case 'all':
        return renderPlaces(categorizedPlaces.all);
      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Markup                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="relative glassmorphism border border-gray-700/50 rounded-2xl p-6">
      {/* Decorative gradients */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-light)] opacity-10 rounded-full blur-3xl"></div>

      {/* Tabs */}
      <nav className="relative z-10 flex overflow-x-auto pb-4 space-x-4">
        {TABS.map((t) => (
          <button key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-md border transition-all font-serif whitespace-nowrap ${activeTab === t.id ? 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-white shadow-lg' : 'border-gray-700/50 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)]'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className="ml-1 bg-gray-800/60 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="relative z-10 mt-6">{getTabContent()}</div>

      {/* Modal */}
      {isModalOpen && selectedPlace && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="glassmorphism max-w-lg w-full rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="flex justify-between items-start p-6 border-b border-gray-700/50">
              <div>
                <h3 className="font-serif text-2xl text-[var(--color-text)] mb-1">{selectedPlace.name}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-xs">{selectedPlace.formatted_address || selectedPlace.vicinity || selectedPlace.address || 'Address not available'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl leading-none text-[var(--color-text-secondary)] hover:text-[var(--color-gold)]">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedPlace.rating && (
                <div className="flex items-center space-x-2 bg-yellow-100/10 text-yellow-400 px-3 py-2 rounded-md inline-flex">
                  <span>⭐</span><span className="font-medium">{selectedPlace.rating}</span>
                  {selectedPlace.user_ratings_total && <span>({selectedPlace.user_ratings_total})</span>}
                </div>
              )}
              {selectedPlace.types?.length > 0 && (
                <div>
                  <h4 className="font-serif mb-2 text-[var(--color-text)]">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.types.map((type, i) => (
                      <span key={i} className="bg-gray-800/50 text-[var(--color-text-secondary)] px-2 py-1 text-xs rounded">
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-2">
                <button onClick={() => {
                  const addr = selectedPlace.formatted_address || selectedPlace.vicinity || selectedPlace.address;
                  if (addr) window.open(`https://maps.google.com/maps?q=${encodeURIComponent(addr)}`, '_blank');
                }} className="flex-1 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] text-white px-4 py-2 rounded-md hover:opacity-90 transition-all font-serif">Open in Maps</button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700/60 text-[var(--color-text)] px-4 py-2 rounded-md hover:bg-gray-700 font-serif">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedItinerary;