// src/pages/login/LoginPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useApolloClient, ApolloError } from '@apollo/client';
import { toast } from 'react-toastify';

import lightBgVideo from '@assets/back1m.mp4';
import darkBgVideo from '@assets/back2m.mp4';
import lightBgImage from '@assets/back1.png';
import darkBgImage from '@assets/back2.png';

import { ADMIN_LOGIN, FORGOT_PASSWORD, ADMIN_REGISTER } from '@graphql/index';
import { 
    AdminLoginInput, 
    AdminLoginPayload,
    AdminRegisterInput,
    AdminRegisterPayload,
    ForgotPasswordInput,
    ForgotPasswordPayload
} from "@interfaces/index";

import { useAuth } from '@contexts/AuthContext';

import "@pages/login/Login.css";

// Define the expected shape of the adminLogin mutation result
interface AdminLoginMutationResult {
    adminLogin: AdminLoginPayload;
}

// Define the expected shape of the adminRegister mutation result
interface AdminRegisterMutationResult {
    adminRegister: AdminRegisterPayload;
}

// Define the expected shape of the forgotPassword mutation result
interface ForgotPasswordMutationResult {
    forgotPassword: ForgotPasswordPayload;
}

type FormMode = 'login' | 'forgotPassword' | 'register';

export const LoginPage = () => {
    // Common state
    const [currentTheme, setCurrentTheme] = useState('light');
    const [videoLoaded, setVideoLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [formMode, setFormMode] = useState<FormMode>('login');

    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Forgot Password state
    const [forgotUsername, setForgotUsername] = useState('');

    // Register state
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, login, isLoading } = useAuth();
    const apolloClient = useApolloClient();

    const locationState = location.state as { from?: Location };
    const from = locationState?.from?.pathname || '/dashboard';

    useEffect(() => {
        const updateTheme = () => {
            const themeAttr = document.documentElement.getAttribute('data-theme') || 'light';
            setCurrentTheme(themeAttr);
        };
        updateTheme();
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    updateTheme();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;
        const currentSource = currentTheme === 'dark' ? darkBgVideo : lightBgVideo;
        if (videoElement.src !== currentSource || !videoLoaded) {
            if (videoElement.src !== currentSource) {
                videoElement.src = currentSource;
                setVideoLoaded(false);
            }
            const handleLoadedData = () => {
                if (!videoLoaded) {
                    setVideoLoaded(true);
                    videoElement.play().catch(error => {
                        console.warn("Video autoplay prevented:", error);
                    });
                }
            };
            if (!videoLoaded) {
                videoElement.addEventListener('loadeddata', handleLoadedData);
            }
            if (videoElement.src === currentSource && videoElement.currentSrc !== currentSource) {
                videoElement.load();
            } else if (videoElement.readyState >= 3 && !videoLoaded) {
                 handleLoadedData();
            }
            return () => {
                videoElement.removeEventListener('loadeddata', handleLoadedData);
            };
        }
    }, [currentTheme, videoLoaded]);

    const [adminLoginMutation, { loading: loginLoading, error: loginError }] = useMutation<
        AdminLoginMutationResult,
        { input: AdminLoginInput }
    >(ADMIN_LOGIN);

    const [adminRegisterMutation, { loading: registerLoading }] = useMutation<
        AdminRegisterMutationResult,
        { input: AdminRegisterInput }
    >(ADMIN_REGISTER);
    
    const [forgotPasswordMutation, { loading: forgotLoading }] = useMutation<
        ForgotPasswordMutationResult,
        { input: ForgotPasswordInput }
    >(FORGOT_PASSWORD, { fetchPolicy: "no-cache" });

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, from]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error('Username and password are required.');
            return;
        }
        console.log('Attempting ADMIN login with:', { username });
        try {
            const { data } = await adminLoginMutation({
                variables: { input: { username, password } }
            });
            if (data?.adminLogin?.admin && data.adminLogin.success) {
                const { admin } = data.adminLogin;
                
                // Store admin ID in localStorage for persistence across refreshes
                localStorage.setItem('adminId', admin.id);
                
                // Store a dummy token for auth header (replace with real token when available)
                localStorage.setItem('authToken', `admin-session-${admin.id}`);
                
                toast.success(data.adminLogin.message || `Welcome back, ${admin.username}!`);
                login(admin);
                navigate(from, { replace: true });
            } else {
                const errorMsg = data?.adminLogin?.message || loginError?.message || 'Login failed: Invalid response from server.';
                console.error('Admin Login failed:', loginError || 'Missing admin data or success false', data);
                toast.error(errorMsg);
                await apolloClient.clearStore().catch(err => console.error("Error clearing store after failed login", err));
            }
        } catch (err) {
            console.error('Admin Login mutation error:', err);
            let errorMessage = 'Login failed. Please check credentials or connection.';
            if (err instanceof ApolloError) {
                errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast.error(errorMessage);
            await apolloClient.clearStore().catch(e => console.error("Error clearing store after failed login", e));
        }
    }, [username, password, adminLoginMutation, login, apolloClient, loginError, from, navigate]);


    const handleRegister = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) {
            toast.error('Username, email, and password are required.');
            return;
        }
        if (registerPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        if (registerPassword.length < 8) {
            toast.error('Password must be at least 8 characters long.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
            toast.error('Invalid email format.');
            return;
        }

        console.log('Attempting ADMIN registration with:', { registerUsername, registerEmail });
        try {
            const { data } = await adminRegisterMutation({
                variables: { input: { username: registerUsername, email: registerEmail, password: registerPassword } }
            });

            if (data?.adminRegister?.admin && data.adminRegister.success) {
                const { admin } = data.adminRegister;
                
                // Store admin ID in localStorage for persistence across refreshes
                localStorage.setItem('adminId', admin.id);
                
                // Store a dummy token for auth header (replace with real token when available)
                localStorage.setItem('authToken', `admin-session-${admin.id}`);
                
                toast.success(data.adminRegister.message || `Registration successful! Welcome, ${admin.username}!`);
                login(admin);
                navigate(from, { replace: true });
            } else {
                const errorMsg = data?.adminRegister?.message || 'Registration failed: Invalid response from server.';
                console.error('Admin Registration failed:', errorMsg, data);
                toast.error(errorMsg);
            }
        } catch (err) {
            console.error('Admin Registration mutation error:', err);
            let errorMessage = 'Registration failed. Please try again.';
            if (err instanceof ApolloError) {
                errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            toast.error(errorMessage);
        }
    }, [registerUsername, registerEmail, registerPassword, confirmPassword, adminRegisterMutation, login, from, navigate]);
    

    const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotUsername.trim()) {
            toast.warning('Please enter the admin username for password reset.');
            return;
        }
        console.log('Attempting password reset for:', forgotUsername);
        try {
            const { data } = await forgotPasswordMutation({
                 variables: { input: { username: forgotUsername } }
            });

            if (data?.forgotPassword.success) {
                toast.info(data.forgotPassword.message || 'Password reset request processed.');
                setFormMode('login');
                setForgotUsername('');
            } else {
                const errorMsg = data?.forgotPassword.message || 'Password reset request failed.';
                toast.error(errorMsg);
            }
        } catch (err) {
             console.error('Forgot Password mutation error:', err);
             let errorMessage = 'Password reset request failed.';
             if (err instanceof ApolloError) {
                errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message;
             } else if (err instanceof Error) {
                 errorMessage = err.message;
             }
             toast.error(errorMessage);
        }
    }, [forgotUsername, forgotPasswordMutation]);

    const bgImage = currentTheme === 'dark' ? darkBgImage : lightBgImage;

    if (isLoading) {
         return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }
    if (isAuthenticated) {
        return null;
    }
    
    const renderForm = () => {
        switch (formMode) {
            case 'login':
                return (
                    <>
                        <h2 className="login-title">Admin Sign In</h2>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="admin-username">Username</label>
                                <input id="admin-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" disabled={loginLoading} autoCapitalize="none" autoComplete="username" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="admin-password">Password</label>
                                <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" disabled={loginLoading} autoComplete="current-password" required />
                            </div>
                            <div className="form-links">
                                <button type="button" onClick={() => setFormMode('forgotPassword')} className="link-button" disabled={loginLoading}>Forgot password?</button>
                            </div>
                            <button type="submit" className="login-button" disabled={loginLoading}>
                                {loginLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                            <div className="form-links">
                                Don't have an account? <button type="button" onClick={() => setFormMode('register')} className="link-button" disabled={loginLoading}>Register here</button>
                            </div>
                        </form>
                    </>
                );
            case 'forgotPassword':
                return (
                    <>
                        <h2 className="login-title">Reset Password</h2>
                        <p className="login-subtitle">Enter username to reset password to default ("admin").</p>
                        <form onSubmit={handleForgotPassword}>
                            <div className="form-group">
                                <label htmlFor="forgot-admin-username">Admin Username</label>
                                <input id="forgot-admin-username" type="text" required value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} placeholder="Enter username" disabled={forgotLoading} autoCapitalize='none' autoComplete='username' />
                            </div>
                            <button type="submit" className="login-button" disabled={forgotLoading}>
                                {forgotLoading ? 'Sending Request...' : 'Reset Password'}
                            </button>
                        </form>
                        <button type="button" onClick={() => setFormMode('login')} className="back-to-login link-button" disabled={forgotLoading}>
                            Back to Login
                        </button>
                    </>
                );
            case 'register':
                return (
                    <>
                        <h2 className="login-title">Admin Registration</h2>
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label htmlFor="register-admin-username">Username</label>
                                <input id="register-admin-username" type="text" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} placeholder="Choose a username" disabled={registerLoading} autoCapitalize="none" autoComplete="username" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="register-admin-email">Email</label>
                                <input id="register-admin-email" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="Enter your email" disabled={registerLoading} autoComplete="email" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="register-admin-password">Password</label>
                                <input id="register-admin-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="Create a password (min 8 chars)" disabled={registerLoading} autoComplete="new-password" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="register-admin-confirm-password">Confirm Password</label>
                                <input id="register-admin-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" disabled={registerLoading} autoComplete="new-password" required />
                            </div>
                            <button type="submit" className="login-button" disabled={registerLoading}>
                                {registerLoading ? 'Registering...' : 'Register'}
                            </button>
                            <div className="form-links">
                                Already have an account? <button type="button" onClick={() => setFormMode('login')} className="link-button" disabled={registerLoading}>Login here</button>
                            </div>
                        </form>
                    </>
                );
        }
    };

    return (
        <div className="login-container">
            <div className="background-container">
                <img src={bgImage} alt="" className={`background-image ${videoLoaded ? 'hidden' : ''}`} aria-hidden="true" />
                <video ref={videoRef} className={`background-video ${videoLoaded ? 'visible' : ''}`} autoPlay muted loop playsInline>
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="login-card">
                <div className="login-card-content">
                    {renderForm()}
                </div>
            </div>
        </div>
    );
};