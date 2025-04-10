import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, IconButton, Grid, DialogTitle, Dialog, DialogActions, DialogContent, CircularProgress, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyPlaceholder from '@components/EmptyPlaceholder';
import { Close } from '@mui/icons-material';
import type { ApiQuizQuestion, ApiQuizChoiceInput, ApiCreateQuizQuestionInput, ApiUpdateQuizQuestionInput } from '@interfaces/quiz.interfaces';

const defaultNewCard: ApiQuizChoiceInput = { choice_text: '', image_url: '' };

interface AddEditQuestionModalProps {
    open: boolean;
    onClose: () => void;
    questionToEdit: ApiQuizQuestion | null;
    onSubmit: (data: ApiCreateQuizQuestionInput | ApiUpdateQuizQuestionInput, id?: string) => void;
    isLoading: boolean;
}

export const AddEditQuestionModal: React.FC<AddEditQuestionModalProps> = ({
    open,
    onClose,
    questionToEdit,
    onSubmit,
    isLoading,
}) => {
    const [formData, setFormData] = useState({
        question_text: '',
        allowed_choices_count: 1,
        choices: [] as ApiQuizChoiceInput[],
    });
    const [newCardInput, setNewCardInput] = useState(defaultNewCard);

    useEffect(() => {
        if (open) {
            if (questionToEdit) {
                setFormData({
                    question_text: questionToEdit.question_text,
                    allowed_choices_count: questionToEdit.allowed_choices_count,
                    choices: questionToEdit.choices.map(c => ({
                        choice_text: c.choice_text,
                        image_url: c.image_url || ''
                    }))
                });
            } else {
                setFormData({
                    question_text: '',
                    allowed_choices_count: 1,
                    choices: []
                });
            }
            setNewCardInput(defaultNewCard);
        }
    }, [questionToEdit, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = name === 'allowed_choices_count' ? parseInt(value, 10) || 1 : value;
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue,
        }));
    };

    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCardInput(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCard = () => {
        if (newCardInput.choice_text.trim()) {
            setFormData(prev => ({
                ...prev,
                choices: [...prev.choices, { ...newCardInput }],
            }));
            setNewCardInput(defaultNewCard);
        }
    };

    const handleDeleteCard = (cardIndex: number) => {
        setFormData(prev => ({
            ...prev,
            choices: prev.choices.filter((_, index) => index !== cardIndex),
        }));
    };

    const handleSubmit = () => {
        if (formData.choices.length === 0) {
            alert("Please add at least one choice.");
            return;
        }
        if (formData.allowed_choices_count > formData.choices.length) {
            alert("Allowed choices count cannot be greater than the total number of choices.");
            return;
        }
        if (formData.allowed_choices_count < 1) {
            alert("Allowed choices count must be at least 1.");
            return;
        }

        const submissionData = {
            question_text: formData.question_text,
            allowed_choices_count: formData.allowed_choices_count,
            choices: formData.choices.map(c => {
                const imageUrlValue = c.image_url ? c.image_url : undefined;
                return {
                    choice_text: c.choice_text,
                    image_url: imageUrlValue
                };
            })
        };

        onSubmit(submissionData, questionToEdit?.id);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '8px' } }}
        >
            <DialogTitle className='dialog-title'>
                {questionToEdit ? 'Update Question' : 'Add New Question'}
                <IconButton className="close-button" onClick={onClose} disabled={isLoading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TextField
                    className='qui-tf'
                    variant="outlined"
                    label="Question"
                    name="question_text"
                    value={formData.question_text}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                    disabled={isLoading}
                />
                <TextField
                    className='qui-tf'
                    variant="outlined"
                    label="Allowed Choices Count"
                    name="allowed_choices_count"
                    type="number"
                    value={formData.allowed_choices_count}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{ inputProps: { min: 1 } }}
                    disabled={isLoading}
                />

                <TextField
                    className='qui-tf'
                    variant="outlined"
                    label="Total Choices Added"
                    value={formData.choices.length}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    disabled={isLoading}
                />

                <Box sx={{ border: '1px solid', borderColor: 'divider', padding: 2, borderRadius: 1, mt: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>Add Choice</Typography>
                    <TextField
                        className='qui-tf'
                        variant="outlined"
                        label="Choice Text"
                        name="choice_text"
                        value={newCardInput.choice_text}
                        onChange={handleCardInputChange}
                        fullWidth
                        margin="dense"
                        disabled={isLoading}
                    />
                    <TextField
                        className='qui-tf'
                        variant="outlined"
                        label="Image URL (Optional)"
                        name="image_url"
                        value={newCardInput.image_url ?? ''}
                        onChange={handleCardInputChange}
                        fullWidth
                        margin="dense"
                        disabled={isLoading}
                    />
                    <Button
                        className='qui-add-card-button'
                        onClick={handleAddCard}
                        variant="contained"
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                        disabled={isLoading || !newCardInput.choice_text.trim()}
                    >
                        Add This Choice
                    </Button>
                </Box>

                <div style={{marginTop: '1rem'}}>
                    <Typography variant="h6" gutterBottom>Choices Added:</Typography>
                    <div className='grid-card-add-modal'>
                        {formData.choices.length === 0 ? (
                            <EmptyPlaceholder title="No choices added yet." />
                        ) : (
                            <Grid container spacing={2}>
                                {formData.choices.map((card, index) => (
                                    <Grid item key={index}>
                                        <div className="quiz-lcard">
                                            <img
                                                className="quiz-card-image"
                                                src={card.image_url}
                                                alt={card.choice_text}
                                            />
                                            <div className="quiz-lcard-choice">
                                                <span>{card.choice_text}</span>
                                                <IconButton
                                                    onClick={() => handleDeleteCard(index)}
                                                    color="error"
                                                    disabled={isLoading}
                                                    sx={{ flex: 1 }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </div>
                </div>
            </DialogContent>

            <DialogActions className='dialog-actions'>
                <Button onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isLoading || !formData.question_text.trim() || formData.choices.length === 0}
                >
                    {isLoading ? <CircularProgress size={24} /> : (questionToEdit ? 'Update Question' : 'Add Question')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};