import React, { useState } from 'react';
import './QuizPage.css';

interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
  allowMultiple: boolean;
}

interface Answer {
  questionId: number;
  selectedOptions: string[];
}

const QuizPage: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      text: "What genres do you enjoy watching the most?",
      options: [
        { id: "action", text: "Action", imageUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg" }, // The Avengers
        { id: "comedy", text: "Comedy", imageUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg" }, // Parasite
        { id: "drama", text: "Drama", imageUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg" }, // Shawshank Redemption
        { id: "horror", text: "Horror", imageUrl: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg" }, // Fight Club (as thriller/horror substitute)
        { id: "scifi", text: "Sci-Fi", imageUrl: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_FMjpg_UX1000_.jpg" }, // Blade Runner 2049
        { id: "animation", text: "Animation", imageUrl: "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg" }, // Spirited Away
        { id: "thriller", text: "Thriller", imageUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg" } // Inception
      ],
      allowMultiple: true
    },
    {
      id: 2,
      text: "How do you prefer to watch movies?",
      options: [
        { id: "theater", text: "Movie Theater", imageUrl: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg" }, // Dune (theatrical experience)
        { id: "streaming", text: "Streaming Services", imageUrl: "https://static.hdrezka.ac/i/2023/4/26/od101a5553311dy48a81e.jpg" }, // The Witcher (TV series)
        { id: "bluray", text: "DVD/Blu-ray", imageUrl: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg" }, // The Godfather (classic physical media)
        { id: "festival", text: "Film Festivals", imageUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg" } // Parasite (festival favorite)
      ],
      allowMultiple: true
    },
    {
      id: 3,
      text: "What factors influence your movie selection the most?",
      options: [
        { id: "director", text: "Director", imageUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg" }, // The Dark Knight (Nolan)
        { id: "cast", text: "Cast", imageUrl: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg" }, // Pulp Fiction (star-studded)
        { id: "reviews", text: "Reviews", imageUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg" }, // Shawshank (highly reviewed)
        { id: "recommendations", text: "Recommendations", imageUrl: "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg" }, // Spirited Away (often recommended)
        { id: "trailer", text: "Trailer", imageUrl: "https://m.media-amazon.com/images/M/MV5BYzg0NGM2NjAtNmIxOC00MDJmLTg5ZmYtYzM0MTE4NWE2NzlhXkEyXkFqcGdeQXVyMTA4NjE0NjEy._V1_FMjpg_UX1000_.jpg" }, // Tenet (trailer-driven hype)
        { id: "awards", text: "Awards", imageUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg" } // Parasite (award-winning)
      ],
      allowMultiple: true
    },
    {
      id: 4,
      text: "Which decade of films do you enjoy the most?",
      options: [
        { id: "1980s", text: "1980s", imageUrl: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg" }, // The Matrix (1999 but close to 80s cyberpunk)
        { id: "1990s", text: "1990s", imageUrl: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg" }, // Pulp Fiction
        { id: "2000s", text: "2000s", imageUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg" }, // The Dark Knight
        { id: "2010s", text: "2010s", imageUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg" }, // Inception
        { id: "2020s", text: "2020s", imageUrl: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg" } // Dune
      ],
      allowMultiple: false
    },
    {
      id: 5,
      text: "How important are ratings when choosing a movie?",
      options: [
        { id: "very", text: "Very Important", imageUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg" }, // Shawshank (high rated)
        { id: "somewhat", text: "Somewhat Important", imageUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg" }, // Interstellar
        { id: "not", text: "Not Important", imageUrl: "https://static.hdrezka.ac/i/2023/5/5/oc9b75b78b731er75w38t.jpg" } // One Piece: Red (lower rating)
      ],
      allowMultiple: false
    }
  ];

  const handleOptionToggle = (optionId: string) => {
    if (questions[currentQuestionIndex].allowMultiple) {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(item => item !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleNextQuestion = () => {
    if (selectedOptions.length === 0) return;

    const newAnswer: Answer = {
      questionId: questions[currentQuestionIndex].id,
      selectedOptions: [...selectedOptions]
    };

    const updatedAnswers = [...userAnswers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      answer => answer.questionId === newAnswer.questionId
    );

    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }

    setUserAnswers(updatedAnswers);
    setSelectedOptions([]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const previousIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(previousIndex);

      const previousAnswer = userAnswers.find(
        answer => answer.questionId === questions[previousIndex].id
      );

      setSelectedOptions(previousAnswer ? previousAnswer.selectedOptions : []);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedOptions([]);
    setQuizCompleted(false);
  };

  // Find option text by ID
  const getOptionTextById = (questionId: number, optionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return "";

    const option = question.options.find(opt => opt.id === optionId);
    return option ? option.text : "";
  };

  const renderQuizContent = () => {
    if (quizCompleted) {
      return (
        <div className="quiz-results">
          <h2>Your Movie Preferences</h2>
          {userAnswers.map((answer, index) => {
            const question = questions.find(q => q.id === answer.questionId);
            return (
              <div key={index} className="result-item">
                <h3>{question?.text}</h3>
                <div className="selected-options">
                  {answer.selectedOptions.map((optionId, optIndex) => (
                    <span key={optIndex} className="selected-option">
                      {getOptionTextById(answer.questionId, optionId)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          <button className="restart-button" onClick={handleRestartQuiz}>
            Restart Quiz
          </button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const instructionText = currentQuestion.allowMultiple
      ? "Select all that apply"
      : "Select one option";

    return (
      <div className="quiz-question">
        <div className="question-progress">
          <span>{currentQuestionIndex + 1}</span> / {questions.length}
        </div>
        <h2>{currentQuestion.text}</h2>
        <p className="instruction-text">{instructionText}</p>
        <div className="options-container">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <div
                key={option.id}
                className={`option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="checkbox-container">
                  <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <span className="checkmark">✓</span>}
                  </div>
                </div>
                {option.imageUrl ? (
                  <div className="option-image">
                    <img src={option.imageUrl} alt={option.text} />
                  </div>
                ) : (
                  <div className="option-no-image">
                    <span>{option.text}</span>
                  </div>
                )}
                <div className="option-text">
                  <span>{option.text}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="quiz-navigation">
          <button
            className="prev-button"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          <button
            className="next-button"
            onClick={handleNextQuestion}
            disabled={selectedOptions.length === 0}
          >
            {isLastQuestion ? 'See Results' : 'Next'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>Quiz</h1>
          <p>Discover your movie personality</p>
        </div>
        {renderQuizContent()}
      </div>
    </div>
  );
};

export default QuizPage;