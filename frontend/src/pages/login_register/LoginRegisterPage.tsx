import React, { useState } from "react";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { Eye, EyeClosed } from "lucide-react";
import "./LoginRegisterPage.css";

const LoginRegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.href = "/";
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lr-container">
      <div className="animated-background">
        <div className='bg-body'>
          <div className="tunnel">
            <div className="a-structure">
              <div className="line-left"></div>
              <div className="line-right"></div>
            </div>
            <div className="a-structure">
              <div className="line-left"></div>
              <div className="line-right"></div>
            </div>
            <div className="a-structure">
              <div className="line-left"></div>
              <div className="line-right"></div>
            </div>
            <div className="reflection"></div>
          </div>
        </div>
      </div>
      <div className="form-container">
        <div className="form-content">
          {page === "login" && (
            <>
              <h1 className="title">Sign In</h1>
              <p className="subtitle">Welcome back to MovieQ!</p>
              <form className="form" onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                <TextField type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <TextField
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
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
                    Remember me
                  </label>
                  <a href="#" onClick={() => setPage("forgot")}>Forgot password?</a>
                </div>
                <Button type="submit" fullWidth disabled={isLoading}>Sign In</Button>
              </form>
              <p className="prompt">Don't have an account? <a href="#" onClick={() => setPage("register")}>Create one</a></p>
            </>
          )}
          {page === "register" && (
            <>
              <h1 className="title">Create Account</h1>
              <p className="subtitle">Join MovieQ today.</p>
              <form className="form" onSubmit={handleSubmit}>
                <TextField type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <TextField
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          className="uv-button"
                        >
                          {showPassword ? <Eye /> : <EyeClosed />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button type="submit" fullWidth disabled={isLoading}>Register</Button>
              </form>
              <p className="prompt">Already have an account? <a href="#" onClick={() => setPage("login")}>Sign in</a></p>
            </>
          )}
          {page === "forgot" && (
            <>
              <h1 className="title">Forgot Password</h1>
              <p className="subtitle">Enter your email to reset password.</p>
              <form className="form" onSubmit={handleSubmit}>
                <TextField type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" fullWidth disabled={isLoading}>Reset Password</Button>
              </form>
              <p className="prompt"><a href="#" onClick={() => setPage("login")}>Back to login</a></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterPage;