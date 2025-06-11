import React, { useState, useEffect } from 'react';

const Toast = ({ message, isVisible, onClose, type = 'info' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm`}>
        <span className="text-lg">
          {type === 'info' && '🚀'}
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'error' && '❌'}
        </span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const ToastComponent = () => (
    <Toast 
      message={toast.message}
      isVisible={toast.isVisible}
      onClose={hideToast}
      type={toast.type}
    />
  );

  return { showToast, ToastComponent };
};

export default Toast;