// --- START OF FILE AddEditActorsModal.tsx ---
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  CircularProgress, // For loading state
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { ApiPersonCore as GqlPerson, PersonInput as PersonSubmitInput } from '@interfaces/person.interfaces'; // Corrected import path and names

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
  // onSubmit now receives the prepared input data for the mutation
  onSubmit: (data: PersonSubmitInput, id?: string) => void;
  isLoading: boolean;
  person: GqlPerson | null; // Use the GraphQL-aligned type
}

const initialFormData: PersonSubmitInput = {
    name: "",
    bio: "",
    birth_date: null, // Store as null initially
    profile_image_url: "",
};


export const AddEditActorsModal: React.FC<PersonModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  person
}) => {
  const [formData, setFormData] = useState<PersonSubmitInput>(initialFormData);

  useEffect(() => {
    if (person) {
      // Map the fetched person data (GqlPerson) to the form state (PersonSubmitInput)
      setFormData({
          name: person.name || "",
          bio: person.bio || "",
          // Format date string for the input type='date'
          birth_date: person.birth_date ? formatDateForInput(person.birth_date) : null,
          profile_image_url: person.profile_image_url || ""
      });
    } else {
      // Reset form for adding a new person
      setFormData(initialFormData);
    }
  }, [person, open]); // Depend on 'open' as well to reset when reopening for 'add'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        // Handle empty string for optional fields explicitly if needed,
        // or rely on GraphQL null handling
        [name]: value === '' ? null : value // Store null if cleared, otherwise the value
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepare data: ensure empty strings become null for optional fields if backend expects null
    const submitData: PersonSubmitInput = {
        ...formData,
        bio: formData.bio?.trim() || null,
        birth_date: formData.birth_date || null, // Already null if empty from handleInputChange
        profile_image_url: formData.profile_image_url?.trim() || null,
    };
    // Pass prepared data and ID (if editing) to the parent component's handler
    onSubmit(submitData, person?.id);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth> {/* Adjusted maxWidth */}
       <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {person ? `Edit ${person.name}` : "Add New Person"}
            <IconButton onClick={onClose} edge="end">
                <Close />
            </IconButton>
        </DialogTitle>

        <DialogContent dividers> {/* Add dividers for better spacing */}
            <Grid container spacing={2}>
                {/* Image Preview and URL Input */}
                <Grid item xs={12}>
                    <TextField
                        label="Profile Image URL"
                        name="profile_image_url" // Matches backend schema
                        value={formData.profile_image_url ?? ''} // Handle null value
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                    />
                    {formData.profile_image_url && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <img
                        src={formData.profile_image_url}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: 200, // Adjusted size
                            objectFit: 'contain',
                            borderRadius: '4px' // Optional styling
                        }}
                        />
                    </div>
                    )}
                </Grid>

                {/* Text Fields */}
                <Grid item xs={12}>
                    <TextField
                    label="Full Name"
                    name="name" // Matches backend schema
                    value={formData.name}
                    onChange={handleInputChange}
                    fullWidth
                    required // Name is required in schema
                    margin="dense" // Use dense margin
                    variant="outlined"
                    />
                </Grid>

                <Grid item xs={12}>
                     <TextField
                        label="Birth Date"
                        name="birth_date" // Matches backend schema
                        type="date"
                        value={formData.birth_date ?? ''} // Handle null value
                        onChange={handleInputChange}
                        fullWidth
                        // 'required' removed as birth_date is optional in input/schema
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                    label="Biography"
                    name="bio" // Matches backend schema
                    value={formData.bio ?? ''} // Handle null value
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={4}
                    margin="dense"
                    variant="outlined"
                    />
                </Grid>

                 {/* REMOVED Fields not in backend schema: type, deathDate, nationality, notableWorks */}

            </Grid>
        </DialogContent>

        <DialogActions sx={{ padding: '16px 24px' }}> {/* Add padding */}
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !formData.name} // Disable if loading or name is empty
          >
            {isLoading ? <CircularProgress size={24} /> : person ? "Save Changes" : "Add Person"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
// --- END OF FILE AddEditActorsModal.tsx ---