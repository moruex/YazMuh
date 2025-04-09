import React, { useState } from 'react';

import { toast } from 'react-toastify';

interface SettingsProps {
  // You can pass any props needed from parent components
}

export const SettingsPage: React.FC<SettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<string>('content');

  // Content Settings State
  const [recommendationAlgorithm, setRecommendationAlgorithm] = useState<string>('hybrid');
  const [autoPublishContent, setAutoPublishContent] = useState<boolean>(false);
  const [contentModeration, setContentModeration] = useState<string>('hybrid');
  const [defaultMovieRating, setDefaultMovieRating] = useState<string>('PG-13');

  // Security Settings State
  const [jwtTokenExpiration, setJwtTokenExpiration] = useState<number>(24);
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);

  // UI Settings State
  const [theme, setTheme] = useState<string>('light');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [newUserAlerts, setNewUserAlerts] = useState<boolean>(true);
  const [contentFlagged, setContentFlagged] = useState<boolean>(true);

  // Extra Settings State
  const [apiRateLimit, setApiRateLimit] = useState<number>(1000);
  const [logLevel, setLogLevel] = useState<string>('info');

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, { autoClose: 3000 });
  };

  const handleSaveSettings = () => {
    // Here you would send the settings to your backend API
    console.log('Saving settings');
    
    // Show success message
    addNotification('Settings saved successfully!', 'success');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Admin Settings</h1>
      </div>

      <div className="settings-tabs">
        <button 
          className={activeTab === 'security' ? 'active' : ''} 
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={activeTab === 'ui' ? 'active' : ''} 
          onClick={() => setActiveTab('ui')}
        >
          UI Preferences
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          className={activeTab === 'content' ? 'active' : ''} 
          onClick={() => setActiveTab('content')}
        >
          Content Settings
        </button>
        <button 
          className={activeTab === 'extra' ? 'active' : ''} 
          onClick={() => setActiveTab('extra')}
        >
          Extra Settings
        </button>
      </div>

      {/* Content Settings */}
      {activeTab === 'content' && (
        <div className="settings-content">
          <h2>Content Settings</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>Recommendation Algorithm</label>
              <select 
                value={recommendationAlgorithm}
                onChange={(e) => setRecommendationAlgorithm(e.target.value)}
              >
                <option value="popularity">Popularity Based</option>
                <option value="rating">Rating Based</option>
                <option value="hybrid">Hybrid Approach</option>
              </select>
              <div className="setting-description">How movie recommendations are generated</div>
            </div>
            
            <div className="setting-item checkbox-item">
              <input 
                type="checkbox" 
                id="autoPublishContent"
                checked={autoPublishContent}
                onChange={(e) => setAutoPublishContent(e.target.checked)}
              />
              <label htmlFor="autoPublishContent">Auto-Publish New Content</label>
              <div className="setting-description">Automatically publish new content without review</div>
            </div>
            
            <div className="setting-item">
              <label>Default Movie Rating</label>
              <select 
                value={defaultMovieRating}
                onChange={(e) => setDefaultMovieRating(e.target.value)}
              >
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
              </select>
              <div className="setting-description">Default rating for new content</div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="settings-content">
          <h2>Security</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>JWT Token Expiration (hours)</label>
              <select 
                value={jwtTokenExpiration}
                onChange={(e) => setJwtTokenExpiration(parseInt(e.target.value))}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
              </select>
              <div className="setting-description">How long until authentication tokens expire</div>
            </div>
            
            <div className="setting-item">
              <label>Session Timeout (minutes)</label>
              <select 
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="60">60</option>
                <option value="120">120</option>
              </select>
              <div className="setting-description">How long until inactive users are logged out</div>
            </div>
          </div>
        </div>
      )}

      {/* UI Settings */}
      {activeTab === 'ui' && (
        <div className="settings-content">
          <h2>UI Preferences</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>Theme</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
              <div className="setting-description">Admin panel color theme</div>
            </div>
            
            <div className="setting-item">
              <label>Items Per Page</label>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <div className="setting-description">Default number of items in tables and lists</div>
            </div>
            
            <div className="setting-item checkbox-item">
              <input 
                type="checkbox" 
                id="sidebarCollapsed"
                checked={sidebarCollapsed}
                onChange={(e) => setSidebarCollapsed(e.target.checked)}
              />
              <label htmlFor="sidebarCollapsed">Sidebar Collapsed by Default</label>
              <div className="setting-description">Start with navigation sidebar minimized</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="settings-content">
          <h2>Notifications</h2>
          <div className="setting-group">
            <div className="setting-item checkbox-item">
              <input 
                type="checkbox" 
                id="emailNotifications"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <label htmlFor="emailNotifications">Email Notifications</label>
              <div className="setting-description">Receive email notifications for important events</div>
            </div>
            
            <div className="setting-item checkbox-item">
              <input 
                type="checkbox" 
                id="newUserAlerts"
                checked={newUserAlerts}
                onChange={(e) => setNewUserAlerts(e.target.checked)}
              />
              <label htmlFor="newUserAlerts">New User Registration Alerts</label>
              <div className="setting-description">Get notified when new users register</div>
            </div>
            
            <div className="setting-item checkbox-item">
              <input 
                type="checkbox" 
                id="contentFlagged"
                checked={contentFlagged}
                onChange={(e) => setContentFlagged(e.target.checked)}
              />
              <label htmlFor="contentFlagged">Content Flagged Alerts</label>
              <div className="setting-description">Get notified when content is flagged by users</div>
            </div>
          </div>
        </div>
      )}

      {/* Extra Settings */}
      {activeTab === 'extra' && (
        <div className="settings-content">
          <h2>Extra Settings</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label>API Rate Limit (requests per minute)</label>
              <input 
                type="number" 
                value={apiRateLimit} 
                onChange={(e) => setApiRateLimit(parseInt(e.target.value))}
              />
              <div className="setting-description">Limit the number of API requests per minute</div>
            </div>
            
            <div className="setting-item">
              <label>Log Level</label>
              <select 
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
              <div className="setting-description">Set the verbosity level of logs</div>
            </div>
          </div>
        </div>
      )}

      <div className="settings-actions">
        <button className="save-button" onClick={handleSaveSettings}>
          Save Settings
        </button>
      </div>
    </div>
  );
};
