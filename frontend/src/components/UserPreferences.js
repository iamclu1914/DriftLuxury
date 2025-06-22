import React, { useState, useEffect } from 'react';

// User preferences and travel history hook
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState({
    favoriteExperiences: [],
    experienceHistory: [],
    preferredBudget: 'medium',
    travelStyle: 'balanced',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    languagePreference: 'en',
    currencyPreference: 'USD'
  });

  const [stats, setStats] = useState({
    totalExperiences: 0,
    favoriteExperienceType: '',
    averageBudget: '',
    exploredCities: []
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('drift_user_preferences');
    const savedStats = localStorage.getItem('drift_user_stats');
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
    
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('drift_user_preferences', JSON.stringify(newPreferences));
  };

  // Add experience to history
  const addExperience = (experience) => {
    const newExperience = {
      id: Date.now(),
      ...experience,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newExperience, ...preferences.experienceHistory].slice(0, 50); // Keep last 50
    const updatedPreferences = {
      ...preferences,
      experienceHistory: updatedHistory
    };

    // Update stats
    const newStats = calculateStats(updatedHistory);
    setStats(newStats);
    localStorage.setItem('drift_user_stats', JSON.stringify(newStats));

    savePreferences(updatedPreferences);
  };

  // Add to favorites
  const addToFavorites = (place) => {
    const updatedFavorites = [...preferences.favoriteExperiences, {
      id: Date.now(),
      ...place,
      addedAt: new Date().toISOString()
    }];

    savePreferences({
      ...preferences,
      favoriteExperiences: updatedFavorites
    });
  };

  // Remove from favorites
  const removeFromFavorites = (placeId) => {
    const updatedFavorites = preferences.favoriteExperiences.filter(fav => fav.id !== placeId);
    savePreferences({
      ...preferences,
      favoriteExperiences: updatedFavorites
    });
  };

  // Check if place is favorited
  const isFavorited = (placeName) => {
    return preferences.favoriteExperiences.some(fav => fav.name === placeName);
  };

  // Calculate user stats
  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      return {
        totalExperiences: 0,
        favoriteExperienceType: '',
        averageBudget: '',
        exploredCities: []
      };
    }

    // Count experience types
    const experienceTypes = {};
    const budgets = [];
    const cities = new Set();

    history.forEach(exp => {
      if (exp.mood) {
        experienceTypes[exp.mood] = (experienceTypes[exp.mood] || 0) + 1;
      }
      if (exp.budget) {
        budgets.push(exp.budget);
      }
      if (exp.location) {
        cities.add(exp.location);
      }
    });

    // Find most frequent experience type
    const favoriteExperienceType = Object.keys(experienceTypes).reduce((a, b) => 
      experienceTypes[a] > experienceTypes[b] ? a : b, ''
    );

    // Calculate most common budget
    const budgetCounts = {};
    budgets.forEach(budget => {
      budgetCounts[budget] = (budgetCounts[budget] || 0) + 1;
    });
    const averageBudget = Object.keys(budgetCounts).reduce((a, b) => 
      budgetCounts[a] > budgetCounts[b] ? a : b, ''
    );

    return {
      totalExperiences: history.length,
      favoriteExperienceType,
      averageBudget,
      exploredCities: Array.from(cities)
    };
  };

  // Get personalized recommendations based on history
  const getPersonalizedRecommendations = () => {
    if (stats.favoriteExperienceType) {
      return {
        suggestedMood: stats.favoriteExperienceType,
        suggestedBudget: stats.averageBudget || 'medium',
        message: `Based on your history, you love ${stats.favoriteExperienceType} experiences!`
      };
    }
    
    return null;
  };

  return {
    preferences,
    stats,
    savePreferences,
    addExperience,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    getPersonalizedRecommendations
  };
};

// User Profile Component
export const UserProfile = ({ isOpen, onClose, userPrefs }) => {
  const [activeTab, setActiveTab] = useState('stats');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Travel Profile</h2>
              <p className="text-purple-100">Personalized insights and preferences</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'stats' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'favorites' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'
            }`}
          >
            ❤️ Favorites
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'history' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'
            }`}
          >
            📖 History
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{userPrefs.stats.totalExperiences}</div>
                  <div className="text-sm text-gray-600">Experiences Created</div>
                </div>
                <div className="bg-pink-50 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-pink-600">{userPrefs.stats.exploredCities.length}</div>
                  <div className="text-sm text-gray-600">Cities Explored</div>
                </div>
              </div>
              
              {userPrefs.stats.favoriteExperienceType && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Your Travel Style</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✨</span>
                    <span className="capitalize font-medium text-purple-600">
                      {userPrefs.stats.favoriteExperienceType} Explorer
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    You tend to enjoy {userPrefs.stats.favoriteExperienceType} experiences the most!
                  </p>
                </div>
              )}
              
              {userPrefs.stats.exploredCities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Cities You've Explored</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPrefs.stats.exploredCities.map((city, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        📍 {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {userPrefs.preferences.favoriteExperiences.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">❤️</span>
                  <p>No favorites yet! Heart places you love during your experiences.</p>
                </div>
              ) : (
                userPrefs.preferences.favoriteExperiences.map((favorite, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{favorite.name}</h4>
                      <p className="text-sm text-gray-600">{favorite.address}</p>
                    </div>
                    <button
                      onClick={() => userPrefs.removeFromFavorites(favorite.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {userPrefs.preferences.experienceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">📖</span>
                  <p>Your adventure history will appear here!</p>
                </div>
              ) : (
                userPrefs.preferences.experienceHistory.slice(0, 10).map((experience, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{experience.location}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(experience.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="capitalize">{experience.mood} vibes</span>
                      <span>•</span>
                      <span className="capitalize">{experience.budget} budget</span>
                      <span>•</span>
                      <span>{experience.duration_hours}h experience</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default useUserPreferences;