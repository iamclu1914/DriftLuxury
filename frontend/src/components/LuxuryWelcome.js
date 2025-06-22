import React, { useState } from 'react';
import './styles.css';

const LuxuryWelcome = ({ onAuthSuccess }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate authentication (replace with real API call)
    if (form.email && form.password) {
      setError('');
      onAuthSuccess();
    } else {
      setError('Please enter both email and password.');
    }
  };  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(circle at top right, rgba(30, 64, 175, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(191, 160, 84, 0.1), transparent 40%)'
      }}></div>
      
      <div className="container max-w-md relative z-10 mx-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2" style={{ 
            background: 'var(--gradient-gold)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>DRIFT</h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm tracking-widest uppercase">
            Luxury Travel Experience
          </p>
        </div>
        
        <div className="p-8 rounded-2xl shadow-lg" style={{ 
          background: 'var(--color-surface)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {isSignIn 
                ? 'Sign in to continue your luxury travel experience' 
                : 'Join DRIFT to begin your personalized travel journey'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50 transition-all"
                style={{ 
                  background: 'rgba(30, 30, 30, 0.7)', 
                  color: 'var(--color-text)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' 
                }}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="p-3 rounded-lg border-0 focus:ring-2 focus:ring-accent/50 transition-all"
                style={{ 
                  background: 'rgba(30, 30, 30, 0.7)', 
                  color: 'var(--color-text)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' 
                }}
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-900/20 px-3 py-2 rounded text-sm" style={{ color: '#FFA0A0' }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="py-3 px-4 rounded-lg mt-4 text-center font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              style={{ 
                background: 'var(--gradient-gold)', 
                color: '#121212', 
                boxShadow: 'var(--shadow-md)' 
              }}
            >
              {isSignIn ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {isSignIn ? (
              <div>
                <p style={{ color: 'var(--color-text-secondary)' }}>New to DRIFT?</p>
                <button 
                  onClick={() => setIsSignIn(false)}
                  className="mt-2 font-medium hover:underline transition-all"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Create an account
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Already have an account?</p>
                <button 
                  onClick={() => setIsSignIn(true)}
                  className="mt-2 font-medium hover:underline transition-all"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxuryWelcome;
