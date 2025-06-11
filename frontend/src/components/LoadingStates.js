import React from 'react';

export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
    <div className="flex items-start space-x-6">
      <div className="w-16 h-16 bg-slate-200 rounded-2xl flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-6 bg-slate-200 rounded-lg mb-3 w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded-lg mb-2 w-full"></div>
        <div className="h-4 bg-slate-200 rounded-lg mb-4 w-2/3"></div>
        <div className="flex space-x-3">
          <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
          <div className="h-6 bg-slate-200 rounded-full w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

export const LoadingSpinner = ({ message = "Curating your experience..." }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-amber-200 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
    </div>
    <div className="mt-6 text-center">
      <div className="text-xl font-bold text-slate-800 mb-2">
        {message}
      </div>
      <div className="text-slate-600 max-w-md mx-auto">
        <div className="loading-text">
          <span className="animate-pulse">Analyzing your preferences</span>
          <span className="animate-pulse delay-500">Finding perfect venues</span>
          <span className="animate-pulse delay-1000">Crafting your itinerary</span>
        </div>
      </div>
    </div>
  </div>
);

export const PulsingDot = ({ delay = 0 }) => (
  <span 
    className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  ></span>
);

export const SmartLoadingMessage = ({ mood, location, duration }) => {
  const messages = [
    `Discovering the best ${mood} experiences in ${location}...`,
    `Curating ${duration}h of perfect moments...`,
    `Finding hidden gems that match your vibe...`,
    `Connecting with local venues...`,
    `Almost ready to reveal your perfect day...`
  ];

  const [currentMessage, setCurrentMessage] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-200 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
        </div>
        <div className="text-2xl animate-bounce">🧭</div>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-semibold text-amber-800 mb-2 h-6">
          {messages[currentMessage]}
        </div>
        <div className="flex justify-center space-x-1">
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </div>
      </div>
    </div>
  );
};