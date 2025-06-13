import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProfileEditFormProps {
  user: {
    avatar_url: string;
    username: string;
    bio: string;
  };
  updateUser: (updatedUser: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const ProfileEditTab: React.FC<ProfileEditFormProps> = ({
  user,
  updateUser,
  handleSubmit
}) => {
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const { t } = useTranslation();

  const handleAvatarClick = () => setAvatarModalOpen(true);
  const handleCloseModal = () => setAvatarModalOpen(false);

  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value);
    // Reset validity state when user types
    setIsUrlValid(true);
  };

  const handleImageError = () => {
    setIsUrlValid(false);
  };

  const handleAvatarSave = () => {
    if (isUrlValid && avatarUrl.trim()) {
      updateUser({ avatar_url: avatarUrl });
      handleCloseModal();
    } else {
      // Show validation message
      setIsUrlValid(false);
    }
  };

  return (
    <div className="profile-edit">
      <form onSubmit={handleSubmit}>
        <div className="edit-profile-grid">
          <div className="edit-sidebar">
            <div className="avatar-upload-container">
              <div className="avatar-upload" onClick={handleAvatarClick}>
                <img src={user.avatar_url} alt="Avatar" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150'} />
                <div className="upload-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span>{t('changePhoto')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="edit-main">
            <div className="form-group">
              <label>{t('username')}</label>
              <input
                value={user.username}
                onChange={(e) => updateUser({ username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('bio')}</label>
              <textarea 
                placeholder={t('bioPlaceholder')} 
                value={user.bio || ''}
                onChange={(e) => updateUser({ bio: e.target.value })}
              />
              <small className="form-help">{t('bioHelp')}</small>
            </div>
            <button type="submit" className="save-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              {t('saveChanges')}
            </button>
          </div>
        </div>
      </form>

      {isAvatarModalOpen && (
        <div className="avatar-modal-overlay">
          <div className="avatar-modal-content">
            <h3>{t('changeProfilePicture')}</h3>
            <p>{t('enterImageUrl')}</p>
            
            <div className="form-group">
              <label htmlFor="avatar-url-input">{t('imageUrl')}</label>
              <input
                id="avatar-url-input"
                type="text"
                value={avatarUrl}
                onChange={handleAvatarUrlChange}
                placeholder="https://example.com/image.png"
                className={!isUrlValid ? 'input-error' : ''}
              />
              {!isUrlValid && (
                <div className="error-message">{t('enterValidImageUrl')}</div>
              )}
            </div>
            
            <div className="avatar-preview">
              <p>{t('preview')}</p>
              <img 
                src={avatarUrl || 'https://via.placeholder.com/150'} 
                alt="Avatar Preview" 
                onError={handleImageError}
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={handleCloseModal} className="button-secondary">{t('cancel')}</button>
              <button onClick={handleAvatarSave} className="button-primary">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditTab;