import React, { useState } from 'react';

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const tabContent = {
    profile: (
      <div className="mt-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4" 
               style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}>
            T
          </div>
          <button className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Change Photo</button>
        </div>
        
        <form className="space-y-4 max-w-md mx-auto">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
            <input
              type="text"
              defaultValue="Travel Enthusiast"
              className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
              style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input
              type="email"
              defaultValue="traveler@example.com"
              className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
              style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Home Location</label>
            <input
              type="text"
              defaultValue="San Francisco, CA"
              className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
              style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          </div>
          
          <button
            className="w-full py-3 px-4 rounded-lg mt-4 text-center font-semibold"
            style={{ background: 'var(--gradient-gold)', color: '#121212', boxShadow: 'var(--shadow-md)' }}
          >
            Save Changes
          </button>
        </form>
      </div>
    ),
    
    preferences: (
      <div className="mt-6 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(30, 30, 30, 0.7)' }}>
            <span style={{ color: 'var(--color-text)' }}>Dark Mode</span>
            <div className="w-12 h-6 bg-gray-700 rounded-full relative">
              <div className="absolute w-5 h-5 rounded-full top-0.5 right-0.5" style={{ background: 'var(--color-accent)' }}></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(30, 30, 30, 0.7)' }}>
            <span style={{ color: 'var(--color-text)' }}>Email Notifications</span>
            <div className="w-12 h-6 bg-gray-700 rounded-full relative">
              <div className="absolute w-5 h-5 bg-gray-400 rounded-full top-0.5 left-0.5"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(30, 30, 30, 0.7)' }}>
            <span style={{ color: 'var(--color-text)' }}>Location Sharing</span>
            <div className="w-12 h-6 bg-gray-700 rounded-full relative">
              <div className="absolute w-5 h-5 rounded-full top-0.5 right-0.5" style={{ background: 'var(--color-accent)' }}></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(30, 30, 30, 0.7)' }}>
            <span style={{ color: 'var(--color-text)' }}>Travel Suggestions</span>
            <div className="w-12 h-6 bg-gray-700 rounded-full relative">
              <div className="absolute w-5 h-5 rounded-full top-0.5 right-0.5" style={{ background: 'var(--color-accent)' }}></div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    security: (
      <div className="mt-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>Change Password</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Current Password</label>
              <input
                type="password"
                className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
                style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>New Password</label>
              <input
                type="password"
                className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
                style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Confirm New Password</label>
              <input
                type="password"
                className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50"
                style={{ background: 'rgba(30, 30, 30, 0.7)', color: 'var(--color-text)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              />
            </div>
            
            <button
              className="w-full py-3 px-4 rounded-lg mt-4 text-center font-semibold"
              style={{ background: 'var(--gradient-gold)', color: '#121212', boxShadow: 'var(--shadow-md)' }}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="p-6 min-h-screen" style={{ color: 'var(--color-text)' }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage your profile, preferences, and account security.</p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="flex rounded-lg p-1 mb-6" style={{ background: 'rgba(30, 30, 30, 0.7)' }}>
          {['profile', 'preferences', 'security'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 px-4 rounded-md text-sm transition-all ${activeTab === tab ? 'font-medium' : ''}`}
              style={{ 
                background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default Account;
