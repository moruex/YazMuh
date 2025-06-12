import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from '@components/app/Navbar';
import HomePage from '@pages/home/HomePage';
import MovieSearch from '@pages/movies/MovieSearchPage';
import ErrorPage from '@pages/error/ErrorPage';
import LoginRegisterPage from '@pages/login_register/LoginRegisterPage';
import MovieDetailsPage from '@pages/movies/MovieDetailsPage';
import NewsDetailsPage from '@pages/news/NewsDetailsPage';
import NewsPage from '@pages/news/NewsPage';
import ProfilePage from '@pages/profile/ProfilePage';
import QuizPage from '@pages/quiz/QuizPage';
import RecPage from '@pages/rec/RecPage';
import AboutPage from '@pages/about/AboutPage';
import ContactsPage from '@pages/contacts/ContactsPage';
import PersonDetailsPage from '@src/pages/person/PersonDetailsPage';
import MoviesPage from '@pages/movies/MoviesPage';
import { AuthProvider, useAuth } from '@src/context/AuthContext';
import ProtectedRoute from '@components/app/ProtectedRoute';

const AppContent = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<MovieSearch />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/recs" element={<RecPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
        <Route path="/person/:identifier" element={<PersonDetailsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:newsId" element={<NewsDetailsPage />} />
        <Route path="/newsd" element={<NewsDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/login" element={isLoggedIn ? <HomePage /> : <LoginRegisterPage />} />
        <Route path="/quiz" element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;