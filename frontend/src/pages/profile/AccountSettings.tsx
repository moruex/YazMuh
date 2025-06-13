import React, { useState, useRef } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface AccountSettingsProps {
    onUpdate: (message: string, type: 'success' | 'error') => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ onUpdate }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('password');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityData, setSecurityData] = useState({
    secondaryEmail: user?.secondary_email || '',
    currentPassword: '',
  });
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Refs for scrolling
  const passwordRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const dangerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    let targetRef;
    
    switch (section) {
      case 'password':
        targetRef = passwordRef;
        break;
      case 'security':
        targetRef = securityRef;
        break;
      case 'danger':
        targetRef = dangerRef;
        break;
      default:
        return;
    }
    
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (!user) {
      setPasswordError('You must be logged in to change your password.');
      return;
    }
    try {
      await authService.updateUser(user.id, {
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
      });
      onUpdate('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred.');
      onUpdate(err.message || 'An error occurred while updating password.', 'error');
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    if (!user) {
      setSecurityError('You must be logged in to update security settings.');
      return;
    }
    try {
      await authService.updateUser(user.id, {
        // secondaryEmail: securityData.secondaryEmail,
        currentPassword: securityData.currentPassword,
      });
      onUpdate('Security settings updated successfully!', 'success');
      setSecurityData({ ...securityData, currentPassword: '' });
    } catch (err: any) {
      setSecurityError(err.message || 'An error occurred.');
      onUpdate(err.message || 'An error occurred while updating security settings.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteMyAccount();
      onUpdate('Account deleted successfully. You are being logged out.', 'success');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      onUpdate(err.message || 'Failed to delete account.', 'error');
    }
    setDeleteModalOpen(false);
  };
  
  return (
    <div className="account-settings">
      <div className="settings-grid">
        <div className="settings-sidebar">
          <div className="settings-nav">
            <div 
              className={`settings-nav-item ${activeSection === 'password' ? 'active' : ''}`}
              onClick={() => scrollToSection('password')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>{t('password')}</span>
            </div>
            <div 
              className={`settings-nav-item ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => scrollToSection('security')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>{t('security')}</span>
            </div>
            <div 
              className={`settings-nav-item danger ${activeSection === 'danger' ? 'active' : ''}`}
              onClick={() => scrollToSection('danger')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>{t('dangerZone')}</span>
            </div>
          </div>
        </div>
        
        <div className="settings-main">
          <div className="settings-card" ref={passwordRef}>
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              {t('changePassword')}
            </h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>{t('currentPassword')}</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>{t('newPassword')}</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  minLength={6} 
                />
                <small className="form-help">{t('passwordMinLengthHelp')}</small>
              </div>
              <div className="form-group">
                <label>{t('confirmNewPassword')}</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>
              {passwordError && <p className="error-message">{t(passwordError)}</p>}
              <button type="submit" className="save-button">{t('updatePassword')}</button>
            </form>
          </div>

          <div className="settings-card" ref={securityRef}>
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              {t('securitySettings')}
            </h3>
            <form onSubmit={handleSecuritySubmit}>
              <div className="form-group">
                <label>{t('secondaryEmailAddress')}</label>
                <input 
                  type="email" 
                  name="secondaryEmail" 
                  value={securityData.secondaryEmail} 
                  onChange={handleSecurityChange}
                  placeholder={t('enterBackupEmail')}
                />
                <small className="form-help">
                  {t('secondaryEmailHelp')}
                </small>
              </div>
              <div className="form-group">
                <label>{t('currentPassword')}</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={securityData.currentPassword} 
                  onChange={handleSecurityChange} 
                  required 
                  placeholder={t('enterCurrentPasswordToConfirm')}
                />
              </div>
              {securityError && <p className="error-message">{t(securityError)}</p>}
              <button type="submit" className="save-button">{t('updateSecuritySettings')}</button>
            </form>
          </div>

          <div className="settings-card danger-zone" ref={dangerRef}>
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              {t('dangerZone')}
            </h3>
            <p>{t('deleteAccountWarning')}</p>
            <button className="danger-button" onClick={() => setDeleteModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              {t('deleteMyAccount')}
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="avatar-modal-overlay">
          <div className="avatar-modal-content delete-modal">
            <h3>{t('deleteAccount')}</h3>
            <p>{t('deleteAccountModalText', { username: user?.username })}</p>
            <div className="form-group">
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder={t('confirmYourUsername')}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setDeleteModalOpen(false)} className="button-secondary">{t('cancel')}</button>
              <button 
                onClick={handleDeleteAccount} 
                className="button-primary delete-confirm-button"
                disabled={deleteConfirmationInput !== user?.username}
              >
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;