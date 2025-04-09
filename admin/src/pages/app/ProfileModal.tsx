import React, { useState, useEffect, useContext } from 'react';
import { useMutation, ApolloError } from '@apollo/client';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Typography,
  Box
} from '@mui/material';
import { Close, Save, Logout } from '@mui/icons-material';
import { AuthContext } from '@pages/app/App';
import { UPDATE_CURRENT_ADMIN_PROFILE } from '@graphql/index';
import { ApiAdmin } from '@interfaces/index';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateAdminSelfVars {
  input: {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  };
}

interface UpdateAdminSelfData {
  updateAdminSelf: ApiAdmin;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { admin, logout, refetchAdminData } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [updateProfile, { loading, error }] = useMutation<
    UpdateAdminSelfData,
    UpdateAdminSelfVars
  >(UPDATE_CURRENT_ADMIN_PROFILE);

  useEffect(() => {
    if (isOpen && admin) {
      setUsername(admin.username || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }, [isOpen, admin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin) {
      toast.error("Admin data not available. Please try again.");
      return;
    }

    const input: UpdateAdminSelfVars['input'] = {};
    let changesMade = false;

    const trimmedUsername = username.trim();
    if (trimmedUsername && trimmedUsername !== admin.username) {
      if (trimmedUsername.length < 3) {
        toast.warning("Username must be at least 3 characters long.");
        return;
      }
      input.username = trimmedUsername;
      changesMade = true;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        toast.warning("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.warning("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        toast.warning("Current password is required to set a new password.");
        return;
      }
      input.newPassword = newPassword;
      input.currentPassword = currentPassword;
      changesMade = true;
    } else if (currentPassword && input.username) {
      input.currentPassword = currentPassword;
    }

    if (!changesMade) {
      toast.info("No changes detected.");
      onClose();
      return;
    }

    if (input.newPassword && !input.currentPassword) {
      toast.error("Current password is required to set a new password.");
      return;
    }

    try {
      const response = await updateProfile({ variables: { input } });

      if (response.data?.updateAdminSelf) {
        toast.success("Profile updated successfully!");
        try {
          await refetchAdminData();
        } catch (refetchError) {
          console.error("Error refetching admin data after update:", refetchError);
          toast.warning("Profile updated, but couldn't refresh data automatically. Please reload if needed.");
        }
        onClose();
      } else {
        console.error("Profile update failed: No data returned.", response);
        toast.error("Failed to update profile. Unexpected response.");
      }
    } catch (err: unknown) {
      console.error("Profile update mutation error:", err);
      if (err instanceof ApolloError) {
        if (err.graphQLErrors.length > 0) {
          toast.error(`Update failed: ${err.graphQLErrors[0].message}`);
        } else if (err.networkError) {
          toast.error(`Network error: ${err.networkError.message}. Please check connection.`);
        } else {
          toast.error("An unexpected error occurred while updating profile.");
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className="profile-modal"
    >
      <DialogTitle className="dialog-title">
        Profile
        <IconButton className="close-button" onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      {admin ? (
        <form onSubmit={handleSave}>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Admin Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                disabled={loading}
                fullWidth
                margin="normal"
                autoComplete="username"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Leave password fields blank to keep your current password.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to change password or username"
                disabled={loading}
                fullWidth
                margin="normal"
                autoComplete="current-password"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                disabled={loading}
                fullWidth
                margin="normal"
                autoComplete="new-password"
              />
            </Box>

            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Retype new password"
              disabled={loading || !newPassword}
              fullWidth
              margin="normal"
              autoComplete="new-password"
            />
          </DialogContent>
          <Divider />
          <DialogActions className="profile-dialog-actions" sx={{ justifyContent: "space-between", p: '12px 24px' }}>

            <Button
              variant="contained"
              color="error"
              onClick={handleLogout}
              disabled={loading}
              startIcon={<Logout />}
              className="logout-button"
              sx={{ mr: 1 }}
            >
              Sign Out
            </Button>
            <div style={{ display: 'flex', gap: '12px' }}>            
              <Button
              onClick={onClose}
              disabled={loading}
              className="cancel-button"
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                className="save-button"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogActions>
        </form>
      ) : (
        <DialogContent>
          <Typography>Loading admin data...</Typography>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ProfileModal;