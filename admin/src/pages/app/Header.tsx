// src/pages/app/Header.tsx
import React, { useState, useContext } from 'react';
import { User as UserIcon } from 'lucide-react'; // Rename default import

import '@styles/components/Header.css';
import DarkModeToggle from './DarkModeToggle';
import { AuthContext } from '@contexts/AuthContext';
import ProfileModal from './ProfileModal'; // Import the modal

// Consider adding a real default avatar image
// import defaultAvatar from '@assets/default-avatar.png';

interface HeaderProps {
  leftComponents?: React.ReactNode;
  rightComponents?: React.ReactNode; // Keep for flexibility, e.g., notifications
  centerComponents?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ leftComponents, rightComponents, centerComponents }) => {
  // Get authentication status and admin data from context
  const { isAuthenticated, admin } = useContext(AuthContext);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleProfileClick = () => {
    // Only open modal if authenticated and admin data is loaded
    if (isAuthenticated && admin) {
      setIsProfileModalOpen(true);
    } else {
        console.warn("Profile clicked but user is not authenticated or admin data is missing.");
        // Optionally, you could trigger a re-fetch or redirect
        // Example: refetchAdminData?.();
    }
    console.log(admin);
  };

  const handleCloseModal = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          {leftComponents}
        </div>
        <div className="header-center">
          {centerComponents}
        </div>
        <div className="header-right">
          {/* Render any custom right components passed via props */}
          {rightComponents}
          {/* Keep DarkModeToggle */}
          <DarkModeToggle onChange={undefined} />
          {/* Profile Button/Avatar - Conditionally render based on auth */}
          {isAuthenticated && admin && ( // Ensure both are true before rendering
            <button
                className="profile-button"
                onClick={handleProfileClick}
                aria-label="Open profile settings"
            >
              {admin?.user?.avatar_url ? (
                <img
                   src={admin?.user?.avatar_url}
                   alt={`${admin.username}'s profile picture`}
                   className="profile-avatar-image"
                 />
              ) : (
                // If no avatarSrc, show the fallback icon immediately
                <UserIcon size={24} className="profile-avatar-icon" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Render the Profile Modal */}
      {/* Pass necessary props like isOpen and onClose */}
      {/* Modal accesses context directly for admin data and logout */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default Header;
