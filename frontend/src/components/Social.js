import React from 'react';

const SocialPost = ({ username, location, days, likes, comments, image }) => (
  <div className="mb-8 rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div className="p-4 flex items-center">
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold" style={{ background: 'var(--color-primary)' }}>
        {username.charAt(0)}
      </div>
      <div className="ml-3">
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{username}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{location} • {days} days ago</p>
      </div>
    </div>
    
    <div className="h-64 bg-gray-800 flex items-center justify-center">
      <span className="text-6xl">{image}</span>
    </div>
    
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span style={{ color: 'var(--color-text-secondary)' }}>❤️ {likes}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>💬 {comments}</span>
        </div>
        <button style={{ color: 'var(--color-accent)' }}>Save</button>
      </div>
      <p style={{ color: 'var(--color-text)' }}>
        Amazing experience in {location}! #travel #adventure
      </p>
    </div>
  </div>
);

const Social = () => (
  <div className="p-6 min-h-screen" style={{ color: 'var(--color-text)' }}>
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold mb-4">Social Posting</h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>Share your travel stories, photos, and connect with other explorers.</p>
    </div>
    
    <div className="max-w-lg mx-auto">
      <SocialPost username="TravelLover" location="Bali" days={2} likes={142} comments={12} image="🏝️" />
      <SocialPost username="AdventureSeeker" location="Swiss Alps" days={5} likes={98} comments={8} image="🏔️" />
      <SocialPost username="WanderlustSoul" location="Tokyo" days={7} likes={201} comments={24} image="🗾" />
    </div>
  </div>
);

export default Social;
