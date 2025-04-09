import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import "./ErrorPage.css";

const ErrorPage: React.FC = () => {
  return (
    <div className="error-container">
      <div className="error-page">
        <div className="error-content">
          {/* Image */}
          <div className="error-image-container">
            <img
              src="/src/assets/error1.png"
              alt="Error"
              className="error-image"
            />
          </div>
          {/* Content */}
          <div className="error-text-container">
            <h1 className="error-code glitch">404</h1>
            <h2 className="error-title1 glitch">Page Not Found</h2>
            <p className="error-message1">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="error-link">
              <Button
                className="error-button neon-glow"
                variant="contained" >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;