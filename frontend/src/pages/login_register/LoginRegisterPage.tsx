import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, IconButton, InputAdornment, TextField, CircularProgress } from '@mui/material';
import { Eye, EyeClosed } from 'lucide-react';
import { useAuth } from '@src/context/AuthContext';
import './LoginRegisterPage.css';
import { useTranslation } from 'react-i18next';

const LoginRegisterPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [page, setPage] = useState("login");

  const { login, register, isLoggedIn, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [formError, setFormError] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, from]);

  useEffect(() => {
    return () => {
      clearError();
      setFormError("");
    };
  }, [page, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearError();

    if (page === "login") {
      if (!email || !password) {
        setFormError("Please enter both email/username and password.");
        return;
      }
      try {
        await login({ login: email, password });
      } catch (err) {
      }
    } else if (page === "register") {
      if (!email || !username || !password || !confirmPassword) {
        setFormError("Please fill in all fields.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setFormError("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
        return;
      }

      try {
        await register({ email, username, password });
      } catch (err) {
      }
    } else if (page === "forgot") {
      if (!email) {
        setFormError("Please enter your email address.");
        return;
      }
      setFormError("");
      alert("Password reset link sent to your email (feature not implemented).");
    }
  };

  const displayError = authError || formError;

  return (
    <div className="lr-container">
      <div className="animated-background">
        <div className='bg-body'>
          <div className="tunnel">
            {[...Array(3)].map((_, i) => (
              <div className="a-structure" key={i}>
                <div className="line-left"></div>
                <div className="line-right"></div>
              </div>
            ))}
            <div className="reflection"></div>
          </div>
        </div>
      </div>
      <div className="form-container">
        <div className="form-content">
          {page === "login" && (
            <>
              <h1 className="title">{t('signIn')}</h1>
              <p className="subtitle">{t('welcomeBack')}</p>
              <form className="form" onSubmit={handleSubmit}>
                {displayError && <div className="error-message">{displayError}</div>}
                <TextField 
                  type="text"
                  label={t('emailOrUsername')}
                  placeholder={t('enterEmailOrUsername')}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  fullWidth
                  margin="normal"
                />
                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t('password')}
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="uv-button"
                        >
                          {showPassword ? <Eye /> : <EyeClosed />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                    {t('rememberMe')}
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); setPage("forgot"); setFormError(''); clearError(); }}>{t('forgotPassword')}</a>
                </div>
                <Button type="submit" fullWidth disabled={isLoading} variant="contained" size="large">
                  {isLoading ? <CircularProgress size={24} /> : t('signIn')}
                </Button>
              </form>
              <p className="prompt">{t('dontHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); setPage("register"); setFormError(''); clearError(); }}>{t('createOne')}</a></p>
            </>
          )}
          {page === "register" && (
            <>
              <h1 className="title">{t('createAccount')}</h1>
              <p className="subtitle">{t('joinToday')}</p>
              <form className="form" onSubmit={handleSubmit}>
                {displayError && <div className="error-message">{displayError}</div>}
                <TextField 
                  type="email" 
                  label={t('email')}
                  placeholder={t('enterEmail')}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  fullWidth 
                  margin="normal"
                />
                <TextField 
                  type="text" 
                  label={t('username')}
                  placeholder={t('chooseUsername')}
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  fullWidth 
                  margin="normal"
                />
                <TextField
                  type={showPassword ? "text" : "password"}
                  label={t('password')}
                  placeholder={t('createPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="uv-button"
                        >
                          {showPassword ? <Eye /> : <EyeClosed />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  type={showPassword ? "text" : "password"} 
                  label={t('confirmPassword')}
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                />
                <Button type="submit" fullWidth disabled={isLoading} variant="contained" size="large">
                  {isLoading ? <CircularProgress size={24} /> : t('register')}
                </Button>
              </form>
              <p className="prompt">{t('alreadyHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); setPage("login"); setFormError(''); clearError(); }}>{t('signIn')}</a></p>
            </>
          )}
          {page === "forgot" && (
            <>
              <h1 className="title">{t('forgotPassword')}</h1>
              <p className="subtitle">{t('enterEmailToReset')}</p>
              <form className="form" onSubmit={handleSubmit}>
                {displayError && <div className="error-message">{displayError}</div>}
                <TextField 
                  type="email" 
                  label={t('email')}
                  placeholder={t('enterEmailAddress')}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  fullWidth 
                  margin="normal"
                />
                <Button type="submit" fullWidth disabled={isLoading} variant="contained" size="large">
                  {isLoading ? <CircularProgress size={24} /> : t('resetPassword')}
                </Button>
              </form>
              <p className="prompt"><a href="#" onClick={(e) => { e.preventDefault(); setPage("login"); setFormError(''); clearError(); }}>{t('backToSignIn')}</a></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterPage;