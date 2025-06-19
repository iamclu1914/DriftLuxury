// EnhancedItinerary.js - luxury styled itinerary display
import React, { useState, useEffect, useMemo } from 'react';

const EnhancedItinerary = ({ overview = {}, dining = [], events = [], attractions = [], fun = [], weather = {} }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋', count: overview?.activities?.length || 0 },
    { id: 'dining', label: 'Dining', icon: '🍽️', count: dining.length },
    { id: 'events', label: 'Events', icon: '🎟️', count: events.length },
    { id: 'attractions', label: 'Attractions', icon: '🏛️', count: attractions.length },
    { id: 'fun', label: 'Fun', icon: '🎪', count: fun.length },
  ];

  const renderOverview = () => {
    if (!overview.activities?.length) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-[var(--color-text-secondary)] text-lg">No activities generated yet</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {weather && weather.temperature && (
            <div className="glassmorphism p-6 rounded-xl border border-gray-700/50 mb-6">
                <h3 className="font-serif text-2xl text-[var(--color-gold-light)] mb-2">Current Weather in {weather.city_name}</h3>
                <div className="flex items-center">
                    <img src={weather.icon_url} alt={weather.description} className="w-16 h-16 mr-4" />
                    <div>
                        <p className="text-4xl font-bold">{weather.temperature}°C</p>
                        <p className="text-[var(--color-text-secondary)]">{weather.description}</p>
                    </div>
                </div>
            </div>
        )}
        {overview.narrative_summary && (
          <div className="glassmorphism p-6 rounded-xl border border-gray-700/50">
            <p className="font-serif text-[var(--color-text)] text-lg leading-relaxed">{overview.narrative_summary}</p>
            {overview.total_estimated_cost && (
              <div className="mt-4 inline-block bg-[var(--color-gold-dark)]/10 text-[var(--color-gold)] px-3 py-1 rounded-full text-sm font-medium">
                💰 {overview.total_estimated_cost}
              </div>
            )}
          </div>
        )}
        {overview.activities.map((a, idx) => (
          <div key={idx} className="glassmorphism p-4 sm:p-6 rounded-xl border border-gray-700/50 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 overflow-hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold)] text-white font-bold">{idx + 1}</div>
            <div className="flex-1">
              <h5 className="font-serif text-xl text-[var(--color-text)] mb-2">{a.title}</h5>
              <p className="text-[var(--color-text-secondary)] mb-3">{a.description}</p>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-medium">
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

  const renderDining = (places) => {
    if (!places.length) {
      return <div className="text-center py-12"><div className="text-6xl mb-4">🍽️</div><p className="text-[var(--color-text-secondary)] text-lg">No dining options found</p></div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {places.map((p, i) => (
          <div key={p.fsq_id || `${p.name}-${i}`}
               className="glassmorphism p-3 sm:p-4 rounded-xl border border-gray-700/50 hover:shadow-modern-lg transition-all cursor-pointer max-w-full">
            <div className="w-full h-32 bg-gray-800/40 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" onError={e => {e.target.onerror=null; e.target.src='https://via.placeholder.com/300x200?text=No+Image';}} />
              ) : (
                <span className="text-4xl">🍽️</span>
              )}
            </div>
            <h5 className="font-serif text-lg text-[var(--color-text)] mb-1 line-clamp-2">{p.name}</h5>
            <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-2">{p.location?.formatted_address || 'Address not available'}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderEvents = (events) => {
    if (!events.length) {
        return <div className="text-center py-12"><div className="text-6xl mb-4">🎟️</div><p className="text-[var(--color-text-secondary)] text-lg">No events found</p></div>;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((e, i) => (
                <a href={e.url} target="_blank" rel="noopener noreferrer" key={e.id || `${e.name}-${i}`}
                   className="glassmorphism block p-3 sm:p-4 rounded-xl border border-gray-700/50 hover:shadow-modern-lg transition-all cursor-pointer max-w-full">
                    <div className="w-full h-32 bg-gray-800/40 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                        {e.image_url ? (
                            <img src={e.image_url} alt={e.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl">🎟️</span>
                        )}
                    </div>
                    <h5 className="font-serif text-lg text-[var(--color-text)] mb-1 line-clamp-2">{e.name}</h5>
                    <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-2">{e.summary || 'No description available.'}</p>
                    <div className="text-xs text-[var(--color-gold-light)]">{new Date(e.start_time).toLocaleString()}</div>
                </a>
            ))}
        </div>
    );
  };

  const renderGooglePlaces = (places, type) => {
    if (!places.length) {
      return <div className="text-center py-12"><div className="text-6xl mb-4">{type === 'attractions' ? '🏛️' : '🎪'}</div><p className="text-[var(--color-text-secondary)] text-lg">No {type} found</p></div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {places.map((p, i) => (
          <div key={p.place_id || `${p.name}-${i}`}
               className="glassmorphism p-3 sm:p-4 rounded-xl border border-gray-700/50 hover:shadow-modern-lg transition-all cursor-pointer max-w-full">
            <div className="w-full h-32 bg-gray-800/40 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              {p.photos && p.photos[0]?.url ? (
                <img src={p.photos[0].url} alt={p.name} className="w-full h-full object-cover" onError={e => {e.target.onerror=null; e.target.src='https://via.placeholder.com/300x200?text=No+Image';}} />
              ) : (
                <span className="text-4xl">{type === 'attractions' ? '🏛️' : '🎪'}</span>
              )}
            </div>
            <h5 className="font-serif text-lg text-[var(--color-text)] mb-1 line-clamp-2">{p.name}</h5>
            <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-2">{p.formatted_address || p.vicinity || 'Address not available'}</p>
          </div>
        ))}
      </div>
    );
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'dining':
        return renderDining(dining);
      case 'events':
        return renderEvents(events);
      case 'attractions':
        return renderGooglePlaces(attractions, 'attractions');
      case 'fun':
        return renderGooglePlaces(fun, 'fun');
      default:
        return null;
    }
  };

  return (
    <div className="relative glassmorphism border border-gray-700/50 rounded-2xl p-6">
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-light)] opacity-10 rounded-full blur-3xl"></div>

      <div className="relative z-10 mb-6 w-full">
        <div className="tab-scroll-container">
          <nav className="tab-navigation">
            {TABS.map((t) => (
              <button key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`tab-button ${activeTab === t.id ? 'tab-active' : 'tab-inactive'}`}>
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
                {t.count > 0 && (
                  <span className="tab-count">{t.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="tab-scroll-indicator"></div>
      </div>

      <div className="relative z-10 mt-6">{getTabContent()}</div>

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
                <div className="items-center space-x-2 bg-yellow-100/10 text-yellow-400 px-3 py-2 rounded-md inline-flex">
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