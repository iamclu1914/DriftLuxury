import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HereNowPlanner from './components/HereNowPlanner';
import TripMode from './components/TripMode';
import LuxuryWelcome from './components/LuxuryWelcome';
import Explore from './components/Explore';
import PlanTrip from './components/PlanTrip';
import Social from './components/Social';
import Account from './components/Account';
import Header from './components/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        {isAuthenticated && <Header />}
        <div className={`flex-1 ${isAuthenticated ? 'pt-20' : ''}`}>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? <HereNowPlanner /> : <LuxuryWelcome onAuthSuccess={() => setIsAuthenticated(true)} />
            } />
            <Route path="/plan" element={isAuthenticated ? <PlanTrip /> : <LuxuryWelcome onAuthSuccess={() => setIsAuthenticated(true)} />} />
            <Route path="/social" element={isAuthenticated ? <Social /> : <LuxuryWelcome onAuthSuccess={() => setIsAuthenticated(true)} />} />
            <Route path="/account" element={isAuthenticated ? <Account /> : <LuxuryWelcome onAuthSuccess={() => setIsAuthenticated(true)} />} />
            <Route path="/trip-mode" element={isAuthenticated ? <TripMode /> : <LuxuryWelcome onAuthSuccess={() => setIsAuthenticated(true)} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;