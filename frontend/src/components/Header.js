import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-gray-700/30 shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/4 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-accent-dark)] opacity-0 group-hover:opacity-70 blur-xl transition-all duration-500 group-hover:duration-200"></div>
              <div className="relative flex items-center">
                <Link to="/">
                  <div className="mr-2 text-3xl sm:text-4xl font-serif font-semibold tracking-wide bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-light)] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">DRIFT</div>
                </Link>
              </div>
            </div>
          </div>          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-4">
            <Link to="/" className="relative px-4 py-2 group">
              <span className={`relative z-10 font-medium tracking-wide ${location.pathname === '/' ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)]'} font-serif`}>Explore</span>
              <span className={`absolute inset-x-0 bottom-1 h-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-20 ${location.pathname === '/' ? 'opacity-100' : 'group-hover:opacity-100'} rounded-full blur-sm group-hover:blur-md transition-all duration-300 transform ${location.pathname === '/' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-left`}></span>
            </Link>
            <Link to="/plan" className="relative px-4 py-2 group">
              <span className={`relative z-10 font-medium tracking-wide ${location.pathname === '/plan' ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-gold)]'} transition-colors duration-300 font-serif`}>Plan Trip</span>
              <span className={`absolute inset-x-0 bottom-1 h-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-20 ${location.pathname === '/plan' ? 'opacity-100' : 'group-hover:opacity-100'} rounded-full blur-sm group-hover:blur-md transition-all duration-300 transform ${location.pathname === '/plan' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-left`}></span>
            </Link>
            <Link to="/social" className="relative px-4 py-2 group">
              <span className={`relative z-10 font-medium tracking-wide ${location.pathname === '/social' ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-gold)]'} transition-colors duration-300 font-serif`}>Social</span>
              <span className={`absolute inset-x-0 bottom-1 h-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-20 ${location.pathname === '/social' ? 'opacity-100' : 'group-hover:opacity-100'} rounded-full blur-sm group-hover:blur-md transition-all duration-300 transform ${location.pathname === '/social' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-left`}></span>
            </Link>
            <Link to="/account" className="relative px-4 py-2 group">
              <span className={`relative z-10 font-medium tracking-wide ${location.pathname === '/account' ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-gold)]'} transition-colors duration-300 font-serif`}>Account</span>
              <span className={`absolute inset-x-0 bottom-1 h-2 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] opacity-20 ${location.pathname === '/account' ? 'opacity-100' : 'group-hover:opacity-100'} rounded-full blur-sm group-hover:blur-md transition-all duration-300 transform ${location.pathname === '/account' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-left`}></span>
            </Link>
          </nav>
          <button 
            className="lg:hidden w-12 h-12 relative flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] shadow hover:shadow-md transition-all duration-300 focus:outline-none border border-gray-700/30"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
              <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out mt-1 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-5 h-0.5 rounded-full bg-[var(--color-text)] transition-all duration-300 ease-in-out mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
            </div>
          </button>
        </div>
      </div>
        {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute left-0 right-0 shadow-lg py-4 px-4 backdrop-blur-xl bg-gray-900/90 border-b border-gray-700/30">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/"
              className="text-lg font-medium p-2 rounded-lg transition-all font-serif"
              style={{ 
                color: location.pathname === '/' ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                background: location.pathname === '/' ? 'rgba(191, 160, 84, 0.1)' : 'transparent'
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>
            <Link 
              to="/plan"
              className="text-lg font-medium p-2 rounded-lg transition-all font-serif"
              style={{ 
                color: location.pathname === '/plan' ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                background: location.pathname === '/plan' ? 'rgba(191, 160, 84, 0.1)' : 'transparent'
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Plan Trip
            </Link>
            <Link 
              to="/social"
              className="text-lg font-medium p-2 rounded-lg transition-all font-serif"
              style={{ 
                color: location.pathname === '/social' ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                background: location.pathname === '/social' ? 'rgba(191, 160, 84, 0.1)' : 'transparent'
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Social
            </Link>
            <Link 
              to="/account"
              className="text-lg font-medium p-2 rounded-lg transition-all font-serif"
              style={{ 
                color: location.pathname === '/account' ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                background: location.pathname === '/account' ? 'rgba(191, 160, 84, 0.1)' : 'transparent'
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
