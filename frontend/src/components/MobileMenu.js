import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { label: 'Explore', path: '/explore', icon: '🌍' },
  { label: 'Plan a Trip', path: '/plan', icon: '🧳' },
  { label: 'Social', path: '/social', icon: '💬' },
  { label: 'Account', path: '/account', icon: '👤' },
];

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-accent)] shadow-lg md:hidden">
      <div className="flex justify-around items-center py-2">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center px-2 py-1 text-xs font-medium transition-all ${location.pathname === item.path ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileMenu;
