// src/pages/login/LoginPage.tsx
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useApolloClient, ApolloError } from '@apollo/client'; // Import ApolloError
import { toast } from 'react-toastify';
// import { Visibility, VisibilityOff } from "@mui/icons-material"; // Unused imports

import lightBgVideo from '@assets/back1m.mp4';
import darkBgVideo from '@assets/back2m.mp4';
import lightBgImage from '@assets/back1.png';
import darkBgImage from '@assets/back2.png';

import { ADMIN_LOGIN, FORGOT_PASSWORD } from '@graphql/index';
import { AdminLoginInput, AdminLoginPayload } from "@interfaces/index"; // Import AdminLoginPayload
import { AuthContext } from '@pages/app/App';

import "@pages/login/Login.css";

// Define the expected shape of the adminLogin mutation result
interface AdminLoginMutationResult {
    adminLogin: AdminLoginPayload; // Contains token and admin object
}

export const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('light'); // State for the current theme
    const videoRef = useRef<HTMLVideoElement>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, login, authCheckComplete } = useContext(AuthContext);
    const apolloClient = useApolloClient();
    // const isMounted = useRef(true); // Usually not needed with modern React hooks

     // Determine where to redirect after login
     const locationState = location.state as { from?: Location };
     const from = locationState?.from?.pathname || '/dashboard';

    // Get theme from HTML attribute and update state
    useEffect(() => {
        const updateTheme = () => {
            const themeAttr = document.documentElement.getAttribute('data-theme') || 'light';
            setCurrentTheme(themeAttr);
        };

        updateTheme(); // Initial check

        // Observe changes to the data-theme attribute
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    updateTheme();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect(); // Cleanup observer on unmount
    }, []);

    // Set up video source based on theme state and handle loading state
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const currentSource = currentTheme === 'dark' ? darkBgVideo : lightBgVideo;

        // Check if the source needs to be changed or video needs loading
        if (videoElement.src !== currentSource || !videoLoaded) {
            // Check if src needs update before loading
            if (videoElement.src !== currentSource) {
                videoElement.src = currentSource;
                setVideoLoaded(false); // Reset loaded state when source changes
            }

            const handleLoadedData = () => {
                if (!videoLoaded) { // Prevent setting state if already loaded
                    setVideoLoaded(true);
                    // Attempt to play after loading
                    videoElement.play().catch(error => {
                        console.warn("Video autoplay prevented:", error);
                        // Consider showing a manual play button if autoplay fails
                    });
                }
            };

            // Add event listener if not already loaded
            if (!videoLoaded) {
                videoElement.addEventListener('loadeddata', handleLoadedData);
            }

            // If src changed, load it
            if (videoElement.src === currentSource && videoElement.currentSrc !== currentSource) {
                videoElement.load();
            } else if (videoElement.readyState >= 3 && !videoLoaded) {
                 // If ready state is already sufficient and source is correct, trigger load manually
                 handleLoadedData();
            }

            // Cleanup function
            return () => {
                videoElement.removeEventListener('loadeddata', handleLoadedData);
            };
        }
    }, [currentTheme, videoLoaded]); // Depend on currentTheme and videoLoaded


    const [adminLogin, { loading: loginLoading, error: loginError }] = useMutation<
        AdminLoginMutationResult,
        { input: AdminLoginInput }
    >(ADMIN_LOGIN);

    const [forgotPassword, { loading: forgotLoading }] = useMutation(
        FORGOT_PASSWORD,
        { fetchPolicy: "no-cache" } // Don't cache login attempts
    );

    // Redirect if already authenticated *after* auth check is complete
    useEffect(() => {
        if (authCheckComplete && isAuthenticated) {
            console.log(`LoginPage: Already authenticated, redirecting to ${from}`);
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, authCheckComplete, navigate, from]);


    // Handle Admin Login Submission
    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Attempting ADMIN login with:', { username });

        const loginUsername = username || 'admin';
        const loginPassword = password || '123456';

        try {
            // Optional: Clear store *before* login if you suspect stale data issues
            // await apolloClient.clearStore(); // Usually not necessary

            const { data } = await adminLogin({
                variables: { input: { username: loginUsername, password: loginPassword } }
            });

            // Ensure data, adminLogin, token, and admin object exist
            if (data?.adminLogin?.token && data.adminLogin.admin) {
                const { token, admin } = data.adminLogin;
                console.log('Admin Login mutation successful:', admin.username);
                toast.success(`Welcome back, ${admin.username}!`);

                // Call the login function from AuthContext, passing the admin data
                login(token, admin);

                // Navigation will now happen via the useEffect hook above
                // when isAuthenticated becomes true.
                // navigate(from, { replace: true }); // REMOVED FROM HERE

            } else {
                // Handle cases where the mutation response structure is unexpected
                const errorMsg = loginError?.message || 'Login failed: Invalid response from server.';
                console.error('Admin Login failed:', loginError || 'Missing token or admin data in response', data);
                toast.error(errorMsg);
                // Consider clearing store on failure if needed
                 await apolloClient.clearStore().catch(e => console.error("Error clearing store after failed login", e));
            }

        } catch (err) {
            // Catch GraphQL errors (like AuthenticationError) and network errors
             console.error('Admin Login mutation error:', err);
            let errorMessage = 'Login failed. Please check credentials or connection.';
            if (err instanceof ApolloError) {
                if (err.graphQLErrors && err.graphQLErrors.length > 0) {
                    // Use the message from the first GraphQL error
                    errorMessage = err.graphQLErrors[0].message;
                } else if (err.networkError) {
                    errorMessage = `Network Error: ${err.networkError.message || 'Connection failed.'}`;
                } else {
                    errorMessage = err.message; // Fallback to general ApolloError message
                }
            } else if (err instanceof Error) {
                errorMessage = err.message; // Catch generic JS errors
            }
            toast.error(errorMessage);
            // Clear store after a failed attempt might be prudent
            await apolloClient.clearStore().catch(e => console.error("Error clearing store after failed login", e));
        }
    }, [username, password, adminLogin, login, apolloClient, loginError]); // Add dependencies


    // Handle Forgot Password Submission (Keep existing logic, ensure error handling)
    const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotUsername.trim()) {
            toast.warning('Please enter the admin username for password reset.');
            return;
        }
        console.log('Attempting password reset for:', forgotUsername);
        try {
            const { data } = await forgotPassword({
                 variables: { input: { username: forgotUsername } }
            });

            if (data?.forgotPassword.success) {
                toast.info(data.forgotPassword.message); // Use info or success based on message content
                setShowForgotPassword(false);
                setForgotUsername(''); // Clear input field
            } else {
                // Handle failure message from backend if success is false
                const errorMsg = data?.forgotPassword.message || 'Password reset request failed.';
                console.warn('Forgot Password backend failure:', errorMsg);
                toast.error(errorMsg);
            }
        } catch (err) {
             console.error('Forgot Password mutation error:', err);
             let errorMessage = 'Password reset request failed.';
             if (err instanceof ApolloError) {
                 if (err.graphQLErrors?.length) {
                    errorMessage = err.graphQLErrors[0].message;
                 } else if (err.networkError) {
                    errorMessage = `Network Error: ${err.networkError.message || 'Check connection.'}`;
                 } else {
                    errorMessage = err.message;
                 }
             } else if (err instanceof Error) {
                 errorMessage = err.message;
             }
             toast.error(errorMessage);
        }
    }, [forgotUsername, forgotPassword]); // Dependencies

    const bgImage = currentTheme === 'dark' ? darkBgImage : lightBgImage;

    // If authentication check is still running and we might be logged in, show loading
    if (!authCheckComplete && localStorage.getItem('jwt_token')) {
         return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }
    // If already authenticated (and check is complete), the redirect effect will handle it.
    // Rendering null briefly is acceptable here while the effect runs.
    if (isAuthenticated) {
        return null;
    }

    // Render the login form
    return (
        <div className="login-container">
            {/* Background elements */}
            <div className="background-container">
                <img
                    src={bgImage}
                    alt="" // Decorative image, alt can be empty
                    className={`background-image ${videoLoaded ? 'hidden' : ''}`}
                    aria-hidden="true"
                />
                <video
                    ref={videoRef}
                    className={`background-video ${videoLoaded ? 'visible' : ''}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    // key={currentTheme} // Remove key, useEffect handles source changes
                    // src is set in useEffect
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Login Card */}
            <div className="login-card">
                <div className="login-card-content">
                    {!showForgotPassword ? (
                        <>
                            <h2 className="login-title">Sign in</h2>
                            <form onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label htmlFor="admin-username">Admin Username</label>
                                    <input
                                        id="admin-username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter username"
                                        disabled={loginLoading}
                                        autoCapitalize="none"
                                        autoComplete="username"
                                        required // Add required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="admin-password">Password</label>
                                    <input
                                        id="admin-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        disabled={loginLoading}
                                        autoComplete="current-password"
                                        required // Add required
                                    />
                                </div>
                                <div className="forgot-password">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="forgot-password-link"
                                        disabled={loginLoading}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <button type="submit" className="login-button" disabled={loginLoading}>
                                    {loginLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                                {/* Error display is handled by react-toastify */}
                            </form>
                        </>
                    ) : (
                        <div className="forgot-password-card">
                            <h2 className="login-title">Reset Password</h2>
                            <p className="login-subtitle">Enter the admin username to request a password reset.</p>
                            <form onSubmit={handleForgotPassword}>
                                <div className="form-group">
                                    <label htmlFor="forgot-admin-username">Admin Username</label>
                                    <input
                                        id="forgot-admin-username"
                                        type="text"
                                        required
                                        value={forgotUsername}
                                        onChange={(e) => setForgotUsername(e.target.value)}
                                        placeholder="Enter username"
                                        disabled={forgotLoading}
                                        autoCapitalize='none'
                                        autoComplete='username'
                                    />
                                </div>
                                <button type="submit" className="login-button" disabled={forgotLoading}>
                                    {forgotLoading ? 'Sending Request...' : 'Reset Password'}
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={() => { setShowForgotPassword(false); setForgotUsername(''); }}
                                className="back-to-login"
                                disabled={forgotLoading}
                            >
                                Back to Login
                            </button>
                            {/* Error display is handled by react-toastify */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};