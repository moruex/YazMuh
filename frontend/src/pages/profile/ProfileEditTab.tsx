import React, { useRef } from 'react';

interface ProfileEditFormProps {
  user: {
    avatar: string;
    nickname: string;
    gender: string;
    age: number;
  };
  updateUser: (updatedUser: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const ProfileEditTab: React.FC<ProfileEditFormProps> = ({ 
  user, 
  updateUser, 
  handleSubmit 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateUser({ avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-edit">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="avatar-upload-container">
          <div className="avatar-upload" onClick={handleAvatarClick}>
            <img src={user.avatar} alt="Avatar" />
            <div className="upload-overlay">
              <svg viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              <span>Change</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden-file-input" />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Nickname</label>
            <input
              value={user.nickname}
              onChange={(e) => updateUser({ nickname: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={user.gender}
              onChange={(e) => updateUser({ gender: e.target.value })} >
              <option value="not-specified">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              min="1"
              max="120"
              value={user.age}
              onChange={(e) => updateUser({ age: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea placeholder="Tell us about yourself..." />
          </div>
        </div>
        <button type="submit" className="save-button">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ProfileEditTab;