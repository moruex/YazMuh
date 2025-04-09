// src/components/Users/AddEditUserModal.tsx  (Example path)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, IconButton, DialogContent, TextField, DialogActions, Button, CircularProgress, Box, Alert } from "@mui/material";
import { Close } from "@mui/icons-material";

// Use the GraphQL User type structure (simplified for the form)
// Note: Omit fields not directly edited here like id, created_at, updated_at
interface UserFormData {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password?: string; // Only for 'add' mode
    avatar_url: string;
    bio: string;
}

// Reflect the actual User type from fragments
interface User {
    id: string; // GraphQL IDs are often strings
    first_name?: string | null;
    last_name?: string | null;
    username: string;
    email: string;
    avatar_url?: string | null;
    bio?: string | null;
    created_at?: string | null; // Or Date
    updated_at?: string | null; // Or Date
}

interface AddEditUserModalProps {
    mode: 'add' | 'edit' | 'view';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => Promise<void>; // Make async
    isLoading: boolean;
    user?: User | null; // Use the updated User interface
    error?: string | null; // To display submission errors
}

const defaultUserData: UserFormData = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '', // Clear password by default
    avatar_url: '',
    bio: ''
};

export const AddEditUserModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    user,
    error
}: AddEditUserModalProps) => {
    const [formData, setFormData] = useState<UserFormData>(defaultUserData);

    useEffect(() => {
        if (mode !== 'add' && user) {
            // Map User to UserFormData, handling nulls
            setFormData({
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                username: user.username ?? '',
                email: user.email ?? '',
                // Don't prefill password field on edit/view
                password: '',
                avatar_url: user.avatar_url ?? '',
                bio: user.bio ?? ''
            });
        } else {
            // Reset form for 'add' mode
            setFormData(defaultUserData);
        }
    }, [mode, user, open]); // Reset form when modal opens/user changes

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation (add more as needed)
        if (mode === 'add' && (!formData.username || !formData.email || !formData.password)) {
            // Handle validation error display
            console.error("Username, email, and password required for adding.");
            return;
        }
        if (mode === 'edit' && (!formData.username || !formData.email)) {
             console.error("Username and email required for editing.");
             return;
        }
        await onSubmit(formData); // Let the parent handle the mutation
    };

    const readOnly = mode === 'view';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="user-dialog-title"
        >
            <DialogTitle id="user-dialog-title" className='dialog-title'>
                {mode === 'add' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'User Details'}
                <IconButton onClick={onClose} aria-label="close">
                    <Close />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                   {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="div" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '8px' }}>
                        <TextField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            margin="dense" // Use dense for better spacing in grid
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                            disabled={isLoading}
                        />
                         <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            margin="dense"
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                            disabled={isLoading}
                        />
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            fullWidth
                            margin="dense"
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                            disabled={isLoading}
                        />
                         <TextField
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            fullWidth
                            margin="dense"
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                            disabled={isLoading}
                        />
                         {/* Only show Password field in 'add' mode */}
                        {mode === 'add' && (
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                margin="dense"
                                variant="outlined"
                                disabled={isLoading}
                                helperText="Required for new user."
                            />
                        )}
                        {/* Leave a placeholder in the grid if password isn't shown */}
                         {mode !== 'add' && <div />}

                         <TextField
                            label="Avatar URL"
                            name="avatar_url"
                            type="url"
                            value={formData.avatar_url}
                            onChange={handleInputChange}
                            fullWidth
                            margin="dense"
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                            disabled={isLoading}
                        />
                         <TextField
                            label="Bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                            margin="dense"
                            variant="outlined"
                            InputProps={{ readOnly: readOnly }}
                             sx={{ gridColumn: 'span 2' }} // Make bio span both columns
                            disabled={isLoading}
                        />
                    </Box>
                </DialogContent>

                <DialogActions className='dialog-actions'>
                    <Button onClick={onClose} disabled={isLoading}>
                        {mode === 'view' ? 'Close' : 'Cancel'}
                    </Button>
                    {mode !== 'view' && (
                        <Button
                            type="submit"
                            variant="contained"
                            color='primary'
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} /> : null}
                        >
                            {isLoading ? 'Saving...' : mode === 'add' ? 'Add User' : 'Save Changes'}
                        </Button>
                    )}
                </DialogActions>
            </form>
        </Dialog>
    );
};