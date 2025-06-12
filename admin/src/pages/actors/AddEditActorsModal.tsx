// --- START OF FILE AddEditActorsModal.tsx ---
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Image } from '@mui/icons-material';
import type { 
  ApiPersonCore, 
  CreatePersonInput, 
  UpdatePersonInput 
} from '@interfaces/person.interfaces';
import "./Actors.css";

// Helper to format Date object to 'YYYY-MM-DD' or return empty string
const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        // Check if it's a valid date before formatting
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (e) {
        return ''; // Handle potential errors during date parsing
    }
};

interface PersonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput) => void;
  isLoading: boolean;
  person: ApiPersonCore | null;
}

const initialFormData: CreatePersonInput = {
    name: "",
    biography: "",
    birthday: null,
    profile_image_url: "",
};

export const AddEditActorsModal: React.FC<PersonModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  person
}) => {
  const [formData, setFormData] = useState<CreatePersonInput | UpdatePersonInput>(initialFormData);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (person) {
      console.log("Person data received:", person); // Debug log
      // Map the fetched person data to the form state
      setFormData({
          name: person.name || "",
          biography: person.biography || "",
          birthday: person.birthday ? formatDateForInput(person.birthday) : null,
          profile_image_url: person.profile_image_url || "",
      });
    } else {
      // Reset form for adding a new person
      setFormData(initialFormData);
    }
  }, [person, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert any empty strings to null for optional fields
    const submitData = { ...formData };
    for (const key in submitData) {
      if (submitData[key as keyof typeof submitData] === '') {
        // Use type assertion to handle the type conversion safely
        (submitData as any)[key] = null;
      }
    }
    
    onSubmit(submitData);
  };

  const imageUrl = formData.profile_image_url || '';
  const placeholderImage = !imageUrl ? (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      color: 'text.secondary',
      height: '100%',
      width: '100%',
      padding: 2
    }}>
      <Image sx={{ fontSize: 60, opacity: 0.5, mb: 1 }} />
      <Typography variant="body2">No image provided</Typography>
    </Box>
  ) : null;

  const bioRows = isMobile ? 4 : 8;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
      className="actor-modal"
    >
       <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <DialogTitle 
          className="actor-modal-title"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <Typography variant="h6">
              {person ? `Edit ${person.name}` : "Add New Person"}
            </Typography>
            <IconButton onClick={onClose} edge="end" disabled={isLoading}>
                <Close />
            </IconButton>
        </DialogTitle>

        <DialogContent className="actor-modal-content" dividers>
            <div className="modal-grid-container">
                {/* Left side - Image */}
                <div className="modal-image-container">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Preview" />
                    ) : placeholderImage}
                    
                    <div className="modal-image-url-input">
                        <TextField
                            label="Profile Image URL"
                            name="profile_image_url"
                            value={imageUrl}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            disabled={isLoading}
                            placeholder="Enter image URL"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Image fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>
                </div>
                
                {/* Right side - All Info */}
                <div className="modal-details-container">
                    <TextField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        margin="normal"
                        variant="outlined"
                        disabled={isLoading}
                    />
                    
                    <TextField
                        label="Birth Date"
                        name="birthday"
                        type="date"
                        value={formData.birthday ?? ''}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        disabled={isLoading}
                    />
                    
                    <TextField
                        label="Biography"
                        name="biography"
                        value={formData.biography ?? ''}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        rows={bioRows}
                        margin="normal"
                        variant="outlined"
                        disabled={isLoading}
                    />
                </div>
            </div>
        </DialogContent>

        <DialogActions className="actor-modal-actions">
          <Button onClick={onClose} color="inherit" disabled={isLoading}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !formData.name}
          >
            {isLoading ? <CircularProgress size={24} /> : person ? "Save Changes" : "Add Person"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
// --- END OF FILE AddEditActorsModal.tsx ---