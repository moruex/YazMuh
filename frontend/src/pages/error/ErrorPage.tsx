import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import "./ErrorPage.css";
import { useTranslation } from 'react-i18next';

const ErrorPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="error-container">
      <div className="error-page">
        <div className="error-content">
          {/* Image */}
          <div className="error-image-container">
            <img
              src="/error.png"
              alt={t('error')}
              className="error-image"
            />
          </div>
          {/* Content */}
          <div className="error-text-container">
            <h1 className="error-code glitch">404</h1>
            <h2 className="error-title1 glitch">{t('pageNotFound')}</h2>
            <p className="error-message1">
              {t('pageNotFoundMessage')}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                className="error-button neon-glow"
                variant="contained"
                onClick={() => window.history.back()}
              >
                {t('goBack')}
              </Button>              
              <Link to="/" className="error-link">
                <Button
                  className="error-button neon-glow"
                  variant="contained" >
                  {t('goHome')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;