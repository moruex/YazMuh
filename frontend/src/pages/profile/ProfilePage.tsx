import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService, UserUpdateInput } from '../../services/authService';
import ProfileTabs from './ProfileTabs';
import ProfileEditTab from './ProfileEditTab';
import AccountSettings from './AccountSettings';
import MovieListsTab from './MovieListsTab';
import { useTranslation } from 'react-i18next';
import './ProfilePage.css';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const ProfilePage: React.FC = () => {
  const { user, logout, updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'lists' | 'settings'>('profile');
  
  const [profileData, setProfileData] = useState({
    id: user?.id || '',
    username: user?.username || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || 'https://via.placeholder.com/150',
    bio: user?.bio || '',
  });

  const [notification, setNotification] = useState<Notification | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
        setProfileData({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url || 'https://via.placeholder.com/150',
            bio: user.bio || '',
        });
    }
  }, [user, navigate]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleProfileUpdate = (update: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...update }));
  };
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Construct the input object, only including changed fields
    const input: UserUpdateInput = {};
    if (profileData.username !== user.username) input.username = profileData.username;
    if (profileData.bio !== (user.bio || '')) input.bio = profileData.bio;
    if (profileData.avatar_url !== (user.avatar_url || 'https://via.placeholder.com/150')) input.avatar_url = profileData.avatar_url;

    if (Object.keys(input).length === 0) {
        showNotification(t("noChangesToSave"), "error");
        return;
    }

    try {
        const updatedUser = await authService.updateUser(user.id, input);
        updateAuthUser(updatedUser); // Update context and local storage
        showNotification(t("profileUpdatedSuccessfully"), "success");
    } catch (error: any) {
        showNotification(error.message || t("failedToUpdateProfile"), "error");
    }
  };

  if (!user) {
    return <div>{t('loading')}</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileEditTab
            user={{
              avatar_url: profileData.avatar_url,
              username: profileData.username,
              bio: profileData.bio,
            }}
            updateUser={handleProfileUpdate}
            handleSubmit={handleSubmit}
          />
        );
      case 'lists':
        return <MovieListsTab />;
      case 'settings':
        return <AccountSettings onUpdate={showNotification} />;
      default:
        return null;
    }
  };

  return (
    <div className="profile-page">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="user-profile-container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img 
              src={profileData.avatar_url} 
              alt={t('userProfilePictureAlt', {username: profileData.username})} 
              className="profile-avatar" 
            />
          </div>
          <div className="profile-info">
            <div className="profile-username">
              <h1>@{profileData.username}</h1>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-count">24</span>
                <span className="stat-label">{t('movies')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">8</span>
                <span className="stat-label">{t('favorites')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">12</span>
                <span className="stat-label">{t('watchlist')}</span>
              </div>
            </div>
            <div className="profile-bio">
              <p>{profileData.bio || t('noBioYet')}</p>
            </div>
          </div>
        </div>
        
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignOut={handleSignOut}
        />
        
        <div className="profile-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;