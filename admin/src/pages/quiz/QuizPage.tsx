import { useState } from 'react';
import { Button, Grid, /* Paper, */ Typography, CircularProgress, Alert } from '@mui/material';
import { Edit, Trash2 } from 'lucide-react';
import { AddEditQuestionModal } from '@pages/quiz/AddEditQuestionModal';
import { useQuery, useMutation } from '@apollo/client';
import { GET_QUIZ_QUESTIONS } from '@graphql/queries/quiz.queries';
import { CREATE_QUIZ_QUESTION, UPDATE_QUIZ_QUESTION, DELETE_QUIZ_QUESTION } from '@graphql/mutations/quiz.mutations';
import type { ApiQuizQuestion, ApiCreateQuizQuestionInput, ApiUpdateQuizQuestionInput } from '@interfaces/quiz.interfaces';
import EmptyPlaceholder from '@components/EmptyPlaceholder';

// Helper functions for display
const getDisplayText = (text: string | null | undefined, fallback = 'N/A') => text || fallback;
const getDisplayImage = (url: string | null | undefined, fallback = 'https://via.placeholder.com/150?text=No+Image') => url || fallback;

export const QuizPage = () => {
    // State for modal and editing
    const [openModal, setOpenModal] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState<ApiQuizQuestion | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);

    // GraphQL queries and mutations
    const { data, loading: loadingQuestions, error: queryError, refetch } = useQuery<{ quizQuestions: ApiQuizQuestion[] }>(
        GET_QUIZ_QUESTIONS,
        {
            fetchPolicy: 'cache-and-network',
            onError: (err) => console.error("Error fetching quiz questions:", err),
        }
    );

    const [createQuestion, { loading: creating }] = useMutation(CREATE_QUIZ_QUESTION, {
        onCompleted: () => {
            setMutationError(null);
            setOpenModal(false);
            setQuestionToEdit(null);
            refetch();
        },
        onError: (err) => setMutationError(`Failed to create question: ${err.message}`),
    });

    const [updateQuestion, { loading: updating }] = useMutation(UPDATE_QUIZ_QUESTION, {
        onCompleted: () => {
            setMutationError(null);
            setOpenModal(false);
            setQuestionToEdit(null);
            refetch();
        },
        onError: (err) => setMutationError(`Failed to update question: ${err.message}`),
    });

    const [deleteQuestion, { loading: deleting }] = useMutation(DELETE_QUIZ_QUESTION, {
        onCompleted: () => {
            setMutationError(null);
            refetch();
        },
        onError: (err) => setMutationError(`Failed to delete question: ${err.message}`),
        refetchQueries: [{ query: GET_QUIZ_QUESTIONS }],
    });

    const isLoading = loadingQuestions || creating || updating || deleting;

    // Event handlers
    const handleOpenAddModal = () => {
        setQuestionToEdit(null);
        setMutationError(null);
        setOpenModal(true);
    };

    const handleOpenEditModal = (question: ApiQuizQuestion) => {
        setQuestionToEdit(question);
        setMutationError(null);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setQuestionToEdit(null);
    };

    const handleModalSubmit = (
        formData: ApiCreateQuizQuestionInput | ApiUpdateQuizQuestionInput,
        id?: string
    ) => {
        setMutationError(null);
        if (id) {
            updateQuestion({ variables: { id, input: formData } });
        } else {
            createQuestion({ variables: { input: formData as ApiCreateQuizQuestionInput } });
        }
    };

    const handleDelete = (questionId: string, questionText: string) => {
        if (window.confirm(`Are you sure you want to delete the question: "${questionText}"?`)) {
            deleteQuestion({ variables: { id: questionId } });
        }
    };

    const questions = data?.quizQuestions ?? [];

    return (
        <div className="quiz-container">
            <div className="div-add-smth">
                <Button
                    className='add-smth'
                    variant="contained"
                    color="primary"
                    onClick={handleOpenAddModal}
                    disabled={isLoading}
                >
                    Add Question
                </Button>
            </div>

            {/* Error Display */}
            {queryError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load questions: {queryError.message}
                </Alert>
            )}
            {mutationError && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMutationError(null)}>
                    {mutationError}
                </Alert>
            )}

            <div className="gen-table-container">
                <table className="main-table">
                    <thead>
                        <tr>
                            <th>Question</th>
                            <th>Total Choices Count</th>
                            <th>Allowed Choices</th>
                            <th className='column-center'>Choices</th>
                            <th className='column-center'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingQuestions && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                    <CircularProgress />
                                </td>
                            </tr>
                        )}
                        {!loadingQuestions && questions.length === 0 && !queryError && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                    <EmptyPlaceholder title="No questions found." />
                                </td>
                            </tr>
                        )}
                        {!loadingQuestions && questions.map((row) => (
                            <tr key={row.id}>
                                <td>{getDisplayText(row.question_text)}</td>
                                <td>{row.choices?.length ?? 0}</td>
                                <td>{row.allowed_choices_count}</td>
                                <td>
                                    <Grid container className='grid-layout'>
                                        {(row.choices ?? []).map((card, cardIndex) => (
                                            <Grid item key={cardIndex} className='grid-card'>
                                                <div className="quiz-card" title={getDisplayText(card.choice_text)}>
                                                    <img
                                                        className="quiz-card-image"
                                                        src={getDisplayImage(card.image_url)}
                                                        alt={getDisplayText(card.choice_text, 'Choice Image')}
                                                    />
                                                    <div className="quiz-card-choice">
                                                        <span>{getDisplayText(card.choice_text)}</span>
                                                    </div>
                                                </div>
                                            </Grid>
                                        ))}
                                        {row.choices?.length === 0 && (
                                            <Typography variant="caption" color="textSecondary">
                                                No choices
                                            </Typography>
                                        )}
                                    </Grid>
                                </td>
                                <td className="column-actions">
                                    <div className="main-action-buttons">
                                        <button
                                            onClick={() => handleOpenEditModal(row)}
                                            className="main-btn main-btn-icon rename"
                                            disabled={isLoading}
                                            title="Edit Question"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(row.id, row.question_text)}
                                            className="main-btn main-btn-icon delete"
                                            disabled={isLoading}
                                            title="Delete Question"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddEditQuestionModal
                open={openModal}
                onClose={handleCloseModal}
                questionToEdit={questionToEdit}
                onSubmit={handleModalSubmit}
                isLoading={creating || updating}
            />
        </div>
    );
};