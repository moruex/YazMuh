import React from 'react';

interface ProfileHeaderProps {
  avatar: string;
  nickname: string;
  username: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ avatar, nickname, username }) => {
  return (
    <div className="profile-header">
      <div className="profile-avatar">
        <img src={avatar} alt={nickname} />
      </div>
      <div className="profile-info">
        <h1>{nickname}</h1>
        <p>@{username}</p>
        <div className="profile-meta">
          <div className="meta-item">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <span>Member since 2022</span>
          </div>
          <div className="meta-item">
            <svg viewBox="0 0 24 24">
              <path d="M18 2h-8L4 8v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V8.83L10.83 4H18v16zM9 7h2v4H9zm3 0h2v4h-2zm3 0h2v4h-2z" />
            </svg>
            <span>42 movies</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;