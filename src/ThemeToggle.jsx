import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

/**
 * 🌙 زر عائم حديث لتبديل الوضع الليلي/النهاري (Pill Switch)
 * ثابت بزاوية الشاشة، ظاهر بكل صفحات الموقع — يُستدعى مرة وحدة بس بأعلى App.jsx
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-fab ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      title={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      aria-label="تبديل الوضع الليلي/النهاري"
    >
      <span className="theme-fab-track">
        <i className="bi bi-sun-fill theme-fab-icon sun"></i>
        <i className="bi bi-moon-stars-fill theme-fab-icon moon"></i>
        <span className="theme-fab-thumb">
          <i className={`bi ${isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
