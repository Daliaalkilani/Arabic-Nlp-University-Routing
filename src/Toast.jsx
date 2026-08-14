import React, { useEffect } from 'react';
import './Toast.css';

/**
 * 🌟 إشعار موحّد (Toast) بدل نوافذ alert() التقليدية
 * usage: <Toast toast={toast} onClose={() => setToast(null)} />
 * toast = { type: 'success' | 'error', message: '...' } أو null
 */
const Toast = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className={`app-toast ${isError ? 'app-toast-error' : 'app-toast-success'}`}>
      <div className="app-toast-content">
        <i className={`bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-stars'} app-toast-icon`}></i>
        <span>{toast.message}</span>
      </div>
      <button className="app-toast-close" onClick={onClose}>&times;</button>
      <div className="app-toast-progress" style={{ animationDuration: `${duration}ms` }}></div>
    </div>
  );
};

export default Toast;
