import React, { useEffect, useState } from 'react';

import '@styles/components/DarkModeToggle.css';

import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
    onChange?: (isDark: boolean) => void; // Add type for onChange prop
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ onChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (onChange) onChange(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  return (
    <div 
      className={`dark-mode-toggle ${isDarkMode ? 'dark' : 'light'}`}
      onClick={toggleDarkMode}
    >
      <div className={`toggle-thumb ${isDarkMode ? 'dark' : 'light'}`}>
        <Sun size={24} className="icon sun-icon" />
        <Moon size={24} className="icon moon-icon" />
      </div>
    </div>
  );
};

export default DarkModeToggle;