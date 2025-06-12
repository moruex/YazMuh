import React from 'react';
import './Navbar.css'; // ms-loader is defined here

const CircularLoader: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <span className="ms-loader" style={{ width: size, height: size }} />
);

export default CircularLoader; 