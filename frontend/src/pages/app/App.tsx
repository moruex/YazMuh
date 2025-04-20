import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from '@components/app/Navbar';
import HomePage from '@pages/home/HomePage';
import MovieSearch from '@pages/movies/MovieSearchPage';
import ErrorPage from '@pages/error/ErrorPage';
import LoginRegisterPage from '@pages/login_register/LoginRegisterPage';
import MovieDetailsPage from '@pages/movies/MovieDetailPage';
import NewsDetailsPage from '@pages/news/NewsDetailsPage';
import NewsPage from '@pages/news/NewsPage';
import ProfilePage from '@pages/profile/ProfilePage';
import QuizPage from '@pages/quiz/QuizPage';
import RecPage from '@pages/rec/RecPage';
import AboutPage from '@pages/about/AboutPage';
import ContactsPage from '@pages/contacts/ContactsPage';
import PersonDetailsPage from '@pages/person/PersonDetailPage';

const App = () => {
  // State to track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        <Navbar isLoggedIn={isLoggedIn} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<MovieSearch />} />
          <Route path="/movies" element={<RecPage />} />
          <Route path="/recs" element={<RecPage />} />
          <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
          <Route path="/person/:personId" element={<PersonDetailsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/newsd" element={<NewsDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          {/* Protected routes */}
          <Route path="/quiz" element={isLoggedIn ? <QuizPage /> : <LoginRegisterPage />} />
          <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <LoginRegisterPage />} />
          {/* Auth routes */}
          <Route path="/login" element={<LoginRegisterPage />} />
          {/* Add a catch-all or specific 404 route if needed */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
        {/* For demo purposes only - toggle login state */}
        <div className="demo-controls">
          <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
            {isLoggedIn ? "Simulate Logout" : "Simulate Login"}
          </button>
        </div>
      </div>
    </Router>
  );
}

export default App;