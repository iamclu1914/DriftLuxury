import React from 'react';

const Explore = () => (
  <div className="p-6 text-center min-h-screen flex flex-col items-center justify-center" style={{ color: 'var(--color-text)' }}>
    <h2 className="text-2xl font-bold mb-4">Explore Destinations</h2>
    <p>Discover new places, trending spots, and curated experiences.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-10">
      {['Paris', 'Tokyo', 'New York', 'Venice', 'Bali', 'Santorini'].map(city => (
        <div 
          key={city}
          className="rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="h-48 bg-gray-800 flex items-center justify-center">
            <span className="text-4xl">{city === 'Paris' ? '🗼' : city === 'Tokyo' ? '🗾' : city === 'New York' ? '🗽' : city === 'Venice' ? '🚤' : city === 'Bali' ? '🏝️' : '🏙️'}</span>
          </div>
          <div className="p-4">
            <h3 className="text-xl mb-2" style={{ color: 'var(--color-accent)' }}>{city}</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Explore the beauty of {city}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Explore;
