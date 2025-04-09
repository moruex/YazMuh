import React from 'react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: 'profile' | 'lists' | 'settings') => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="profile-tabs">
      <button
        className={activeTab === 'profile' ? 'active' : ''}
        onClick={() => setActiveTab('profile')} >
        Edit Profile
      </button>
      <button
        className={activeTab === 'lists' ? 'active' : ''}
        onClick={() => setActiveTab('lists')} >
        My Lists
      </button>
      <button
        className={activeTab === 'settings' ? 'active' : ''}
        onClick={() => setActiveTab('settings')} >
        Account Settings
      </button>
    </div>
  );
};

export default ProfileTabs;