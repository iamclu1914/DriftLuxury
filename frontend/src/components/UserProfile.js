import React, { useState } from 'react';
import useUserPreferences from '../hooks/useUserPreferences';

const UserProfile = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences, getRecommendations, clearData } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('overview');
  const recommendations = getRecommendations();

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut Allergies'
  ];

  const accessibilityOptions = [
    'Wheelchair Accessible', 'Hearing Impaired', 'Visually Impaired', 'Mobility Assistance'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-amber-700 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-amber-400/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Your Travel Profile</h2>
                <p className="text-amber-100">Personalize your DRIFT experience</p>
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

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'preferences', label: 'Preferences', icon: '⚙️' },
              { id: 'history', label: 'Travel History', icon: '🗓️' },
              { id: 'saved', label: 'Saved Plans', icon: '📌' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                  <div className="text-2xl font-bold text-amber-800 mb-2">
                    {preferences.travelHistory.length}
                  </div>
                  <div className="text-amber-700">Experiences Curated</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-800 mb-2">
                    {preferences.savedItineraries.length}
                  </div>
                  <div className="text-blue-700">Itineraries Saved</div>
                </div>
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <div className="text-2xl font-bold text-green-800 mb-2">
                    {preferences.favoriteLocations.length}
                  </div>
                  <div className="text-green-700">Favorite Destinations</div>
                </div>
              </div>

              {recommendations.experienceCount > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">🎯 Your Travel Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-slate-600 mb-2">Favorite Experience Type</div>
                      <div className="text-lg font-semibold text-slate-800 capitalize">
                        {recommendations.suggestedMood || 'Still learning your preferences'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600 mb-2">Preferred Activities</div>
                      <div className="flex flex-wrap gap-2">
                        {recommendations.favoriteCategories.map(category => (
                          <span key={category} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Dietary Restrictions */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">🍽️ Dietary Preferences</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dietaryOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.dietaryRestrictions.includes(option)}
                        onChange={(e) => {
                          const newRestrictions = e.target.checked
                            ? [...preferences.dietaryRestrictions, option]
                            : preferences.dietaryRestrictions.filter(r => r !== option);
                          updatePreferences({ dietaryRestrictions: newRestrictions });
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accessibility */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">♿ Accessibility Needs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accessibilityOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.accessibilityNeeds.includes(option)}
                        onChange={(e) => {
                          const newNeeds = e.target.checked
                            ? [...preferences.accessibilityNeeds, option]
                            : preferences.accessibilityNeeds.filter(n => n !== option);
                          updatePreferences({ accessibilityNeeds: newNeeds });
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency and Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">💰 Preferred Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => updatePreferences({ currency: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">🌍 Language</label>
                  <select
                    value={preferences.languagePreference}
                    onChange={(e) => updatePreferences({ languagePreference: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">🗓️ Your Travel History</h3>
              {preferences.travelHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">🗺️</div>
                  <div className="text-lg font-medium mb-2">No travel history yet</div>
                  <div>Start planning experiences to build your travel profile!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {preferences.travelHistory.slice(0, 10).map(experience => (
                    <div key={experience.id} className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{experience.location}</div>
                          <div className="text-sm text-slate-600 capitalize">{experience.mood} • {experience.budget}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(experience.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {experience.activities?.length || 0} activities
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 mb-4">📌 Saved Itineraries</h3>
              {preferences.savedItineraries.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">📋</div>
                  <div className="text-lg font-medium mb-2">No saved itineraries</div>
                  <div>Save your favorite plans for quick access later!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {preferences.savedItineraries.map(saved => (
                    <div key={saved.id} className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{saved.name}</div>
                          <div className="text-sm text-slate-600">{saved.itinerary.location}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Saved {new Date(saved.savedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6">
          <div className="flex justify-between">
            <button
              onClick={clearData}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Clear All Data
            </button>
            <button
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;