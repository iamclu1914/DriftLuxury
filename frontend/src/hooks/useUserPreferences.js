import { useState, useEffect } from 'react';

const useUserPreferences = () => {
  const [preferences, setPreferences] = useState({
    favoriteLocations: [],
    preferredMoods: [],
    budgetTier: 'medium',
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    languagePreference: 'en',
    currency: 'USD',
    savedItineraries: [],
    travelHistory: []
  });

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('drift_user_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  const updatePreferences = (updates) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    localStorage.setItem('drift_user_preferences', JSON.stringify(newPreferences));
  };

  const addToHistory = (experience) => {
    const newHistory = [
      {
        id: Date.now(),
        location: experience.location,
        mood: experience.mood,
        budget: experience.budget,
        activities: experience.activities,
        rating: null,
        date: new Date().toISOString(),
        coordinates: experience.coordinates
      },
      ...preferences.travelHistory.slice(0, 49) // Keep last 50 experiences
    ];
    
    updatePreferences({ travelHistory: newHistory });
  };

  const saveItinerary = (itinerary, name) => {
    const savedItinerary = {
      id: Date.now(),
      name: name || `${itinerary.location} Experience`,
      itinerary,
      savedAt: new Date().toISOString()
    };
    
    const newSaved = [savedItinerary, ...preferences.savedItineraries.slice(0, 19)]; // Keep last 20
    updatePreferences({ savedItineraries: newSaved });
  };

  const getRecommendations = () => {
    const { travelHistory, preferredMoods } = preferences;
    
    // Analyze user patterns
    const moodFrequency = {};
    const locationTypes = {};
    
    travelHistory.forEach(exp => {
      moodFrequency[exp.mood] = (moodFrequency[exp.mood] || 0) + 1;
      if (exp.activities) {
        exp.activities.forEach(activity => {
          locationTypes[activity.category] = (locationTypes[activity.category] || 0) + 1;
        });
      }
    });

    return {
      suggestedMood: Object.keys(moodFrequency).sort((a, b) => moodFrequency[b] - moodFrequency[a])[0],
      favoriteCategories: Object.keys(locationTypes).sort((a, b) => locationTypes[b] - locationTypes[a]).slice(0, 3),
      experienceCount: travelHistory.length
    };
  };

  const clearData = () => {
    localStorage.removeItem('drift_user_preferences');
    setPreferences({
      favoriteLocations: [],
      preferredMoods: [],
      budgetTier: 'medium',
      dietaryRestrictions: [],
      accessibilityNeeds: [],
      languagePreference: 'en',
      currency: 'USD',
      savedItineraries: [],
      travelHistory: []
    });
  };

  return {
    preferences,
    updatePreferences,
    addToHistory,
    saveItinerary,
    getRecommendations,
    clearData
  };
};

export default useUserPreferences;