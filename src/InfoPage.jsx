import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = ({ icon, title, children }) => {
  return (
    <div className="info-page">
      <div className="info-page-banner">
        <Link to="/" className="info-page-back">
          <i className="bi bi-arrow-right"></i> الرئيسية
        </Link>
        <div className="info-page-banner-inner">
          <i className={`bi ${icon}`}></i>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="info-page-content">
        {children}
      </div>
    </div>
  );
};

export default InfoPage;
