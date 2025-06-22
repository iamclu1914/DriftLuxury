import React from 'react';
import { Link } from 'react-router-dom';

const PlanTrip = () => (
  <div className="p-6 min-h-screen flex flex-col items-center justify-center" style={{ color: 'var(--color-text)' }}>
    <div className="text-center mb-12">
      <h2 className="text-2xl font-bold mb-4">Plan a Trip</h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>Start planning your next adventure with DRIFT's AI-powered tools.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
      <Link to="/"
        className="p-8 rounded-xl flex flex-col items-center text-center transition-all hover:scale-[1.03]"
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid rgba(191, 160, 84, 0.2)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <span className="text-4xl mb-4">🌆</span>
        <h3 className="text-xl mb-2" style={{ color: 'var(--color-accent)' }}>Here & Now</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Discover what's around you right now and get instant recommendations</p>
      </Link>
      
      <Link to="/trip-mode"
        className="p-8 rounded-xl flex flex-col items-center text-center transition-all hover:scale-[1.03]"
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid rgba(191, 160, 84, 0.2)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <span className="text-4xl mb-4">✈️</span>
        <h3 className="text-xl mb-2" style={{ color: 'var(--color-accent)' }}>Trip Mode</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Plan your multi-day trips with flights, accommodations, and custom itineraries</p>
      </Link>
    </div>
  </div>
);

export default PlanTrip;
