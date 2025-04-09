// src/components/Admins/AddEditAdminModal.tsx (Example path)
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, IconButton, DialogContent, TextField, DialogActions, Button,
    CircularProgress, Box, Alert, Select, MenuItem, InputLabel, FormControl, SelectChangeEvent
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { AdminRole } from '@interfaces/index';

// Admin fields relevant for the form
interface AdminFormData {
    username: string;
    password?: string; // Only for 'add'
    role: AdminRole;
    userId?: string;   // Only for 'add' - ID of existing User to link
}

// Reflect the actual Admin type from fragments
interface Admin {
    id: string;
    username: string;
    role: AdminRole;
    createdAt?: string | null; // Or Date
    updatedAt?: string | null; // Or Date
    user?: { // Nested user data
        id: string;
        username: string;
        email: string;
    } | null;
}

interface AddEditAdminModalProps {
    mode: 'add' | 'edit' | 'view';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: AdminFormData) => Promise<void>; // Make async
    isLoading: boolean;
    admin?: Admin | null;
    error?: string | null;
}

const defaultAdminData: AdminFormData = {
    username: '',
    password: '',
    role: AdminRole.ADMIN, // Default role
    userId: ''
};

// Ensure AdminRole enum matches your GraphQL schema
// You might get this from generated types or define it manually:
// enum AdminRole { SUPER_ADMIN = "SUPER_ADMIN", ADMIN = "ADMIN", CONTENT_MODERATOR = "CONTENT_MODERATOR" }

export const AddEditAdminModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    admin,
    error
}: AddEditAdminModalProps) => {
    const [formData, setFormData] = useState<AdminFormData>(defaultAdminData);

    useEffect(() => {
        if (mode !== 'add' && admin) {
            setFormData({
                username: admin.username ?? '',
                role: admin.role ?? AdminRole.ADMIN,
                password: '', // Don't prefill password
                userId: ''    // Not editable after creation
            });
        } else {
            setFormData(defaultAdminData);
        }
    }, [mode, admin, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

     const handleRoleChange = (event: SelectChangeEvent<AdminRole>) => {
        setFormData(prev => ({ ...prev, role: event.target.value as AdminRole }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
         if (mode === 'add' && (!formData.username || !formData.password || !formData.userId)) {
             console.error("Username, password, and User ID required for adding Admin.");
             return;
         }
          if (mode === 'edit' && !formData.username) {
             console.error("Username required for editing Admin.");
             return;
         }
        await onSubmit(formData);
    };

    const readOnly = mode === 'view';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm" // Admins have fewer fields, 'sm' might be better
            fullWidth
            aria-labelledby="admin-dialog-title"
        >
            <DialogTitle id="admin-dialog-title" className='dialog-title'>
                {mode === 'add' ? 'Add New Admin' : mode === 'edit' ? 'Edit Admin' : 'Admin Details'}
                <IconButton onClick={onClose} aria-label="close">
                    <Close />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                     {/* Display linked user info in view/edit mode */}
                     {mode !== 'add' && admin?.user && (
                         <Box mb={2} p={1.5} border={1} borderColor="divider" borderRadius={1}>
                             <InputLabel shrink>Linked User</InputLabel>
                             <div>Username: {admin.user.username}</div>
                             <div>Email: {admin.user.email}</div>
                             <div>User ID: {admin.user.id}</div>
                         </Box>
                     )}

                    <TextField
                        label="Admin Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        margin="normal"
                        variant="outlined"
                        InputProps={{ readOnly: readOnly }}
                        disabled={isLoading}
                    />

                    {/* Only show Password and UserID fields in 'add' mode */}
                    {mode === 'add' && (
                        <>
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                                disabled={isLoading}
                                helperText="Required for new admin."
                            />
                             <TextField
                                label="Existing User ID to Link"
                                name="userId"
                                value={formData.userId}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                                disabled={isLoading}
                                helperText="ID of the registered user to grant admin rights."
                            />
                        </>
                    )}

                    <FormControl fullWidth margin="normal" required disabled={isLoading || readOnly}>
                         <InputLabel id="role-select-label">Role</InputLabel>
                         <Select
                            labelId="role-select-label"
                            id="role-select"
                            name="role"
                            value={formData.role}
                            label="Role"
                            onChange={handleRoleChange}
                            readOnly={readOnly}
                          >
                            {/* Get roles from your enum/types */}
                            {Object.values(AdminRole).map((roleValue) => (
                                <MenuItem key={roleValue} value={roleValue}>
                                    {roleValue.replace('_', ' ')} {/* Make it pretty */}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                            {isLoading ? 'Saving...' : mode === 'add' ? 'Add Admin' : 'Save Changes'}
                        </Button>
                    )}
                </DialogActions>
            </form>
        </Dialog>
    );
};
