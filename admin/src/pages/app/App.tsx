// src/pages/app/App.tsx

import React, { createContext, useCallback, useEffect, useState, useRef } from 'react'; // Added useRef
import { toast, ToastContainer } from 'react-toastify';
import {
    useLazyQuery,
    useApolloClient,
    ApolloQueryResult,
    useMutation,
    ApolloError, // Import ApolloError
} from '@apollo/client';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import '@src/index.css';
import '@styles/components/Sidebar.css';

import Sidebar from "@components/sidebar/Sidebar";
import { MenuIcon } from 'lucide-react';
import MobileSidebar from '@components/sidebar/MobileSidebar';
import Header from '@pages/app/Header';
import Breadcrumbs from '@pages/app/Breadcrumbs';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from '@pages/login/LoginPage';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { MoviesPage } from '@pages/movies/MoviesPage';
import { RecommendationsPage } from '@pages/recommendations/RecommendationsPage';
import { ActorsPage } from '@pages/actors/ActorsPage';
import { GenresPage } from '@pages/genres/GenresPage';
import { NewsPage } from '@pages/news/NewsPage';
import { QuizPage } from '@pages/quiz/QuizPage';
import { UsersPage } from '@pages/users/UsersPage';
import { AdminsPage } from '@pages/users/AdminsPage';
import { StoragePage } from '@pages/storage/StoragePage';
import { CommentsPage } from '@pages/comments/CommentsPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
import { ApiAdmin } from '@interfaces/index';
import { ADMIN_LOGOUT, GET_CURRENT_ADMIN } from '@graphql/index';

// --- Enhanced Auth Context ---
interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin: boolean;
    token: string | null;
    admin: ApiAdmin | null;
    // Modified login signature to accept admin data
    login: (token: string, adminData: ApiAdmin) => void;
    logout: () => Promise<void>;
    refetchAdminData: () => Promise<ApolloQueryResult<{ meAdmin: ApiAdmin | null }>>; // Query is meAdmin
    authCheckComplete: boolean;
}

// Default refetch function matching the actual query name 'meAdmin'
const defaultRefetch = (): Promise<ApolloQueryResult<{ meAdmin: ApiAdmin | null }>> => Promise.reject("Refetch function not initialized");

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isAdmin: false,
    token: null,
    admin: null,
    login: () => { },
    logout: () => Promise.resolve(),
    refetchAdminData: defaultRefetch,
    authCheckComplete: false,
});

// --- Protected Route ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, authCheckComplete } = React.useContext(AuthContext);
    const location = useLocation();

    if (!authCheckComplete) {
        // Only show loading if a token exists, indicating a check is in progress
        const potentiallyLoggedIn = !!localStorage.getItem('jwt_token');
        return potentiallyLoggedIn ? <div style={{ padding: '20px', textAlign: 'center' }}>Checking Authentication...</div> : null;
    }

    if (!isAuthenticated) {
        console.log("ProtectedRoute: Not authenticated, redirecting to /login");
        // Pass the current location so the user can be redirected back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// --- App Layout (No changes needed here, keep as is) ---
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [responsive, setResponsive] = useState<string>('minimized');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();
    const { isAuthenticated, admin } = React.useContext(AuthContext);

    const getCurrentPageName = () => {
        const pathSegments = location.pathname.substring(1).split('/');
        const page = pathSegments[0] || 'dashboard';
        if (!page || page === 'app') return "Dashboard";
        return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ');
    };

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' ||
                (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }
        setDrawerOpen(open);
    };

    const closeDrawer = () => setDrawerOpen(false);


    useEffect(() => {
        // Dynamic CSS imports based on route (keep as is)
        if (location.pathname === '/' || location.pathname === '/dashboard') {
            import('./App.css');
            import('@pages/dashboard/Dashboard.css');
        } else if (location.pathname === '/login') {
            import('./App.css');
            import('@pages/login/Login.css');
        } else if (location.pathname === '/movies') {
            import('@pages/movies/Movies.css');
        } else if (location.pathname === '/recommendations') {
            import('@pages/recommendations/Recommendations.css');
        } else if (location.pathname === '/actors') {
            import('@pages/actors/Actors.css');
        } else if (location.pathname === '/genres') {
            import('@pages/genres/Genres.css');
        } else if (location.pathname === '/news') {
            import('@pages/news/News.css');
        } else if (location.pathname === '/quiz') {
            import('@pages/quiz/Quiz.css');
        } else if (location.pathname === '/comments') {
            import('@pages/comments/Comments.css');
        } else if (location.pathname === '/users' || location.pathname === '/roles') {
            import('@pages/users/Users.css');
        } else if (location.pathname === '/storage') {
            import('@pages/storage/Storage.css');
        } else if (location.pathname === '/settings') {
            import('@pages/settings/Settings.css');
        }
    }, [location.pathname]);

    const isLoginPage = location.pathname === '/login';

    return (
        <>
            {!isLoginPage && admin && admin.role && (
                <>
                    <Sidebar responsive={responsive} setResponsive={setResponsive} adminRole={admin.role} />
                    <MobileSidebar clicked={drawerOpen} setClicked={setDrawerOpen} adminRole={admin.role} />
                    {drawerOpen && <div className="sidebar-overlay active" onClick={closeDrawer}></div>}
                </>
            )}
            <div className={`area ${responsive} ${isLoginPage ? 'login-area' : ''}`}>
                {!isLoginPage && (
                    <Header
                        leftComponents={
                            responsive === 'hidden1' ? (
                                <>
                                    <button className='menu-button' onClick={toggleDrawer(true)} aria-label="Open menu">
                                        <MenuIcon size={20} />
                                    </button>
                                    <Breadcrumbs currentPage={getCurrentPageName()} />
                                </>
                            ) : (
                                <Breadcrumbs currentPage={getCurrentPageName()} />
                            )
                        }
                        rightComponents={
                            isAuthenticated ? (
                                <div className="header-admin-info">
                                    {/* Optional: Display username/role if needed */}
                                </div>
                            ) : null
                        }
                        centerComponents={null}
                    />
                )}
                <div className="content">
                    {children}
                </div>
            </div>
        </>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<ApiAdmin | null>(null);
    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    const client = useApolloClient();
    const initialCheckPerformed = useRef(false); // Prevent multiple initial checks

    // Use 'meAdmin' as the query name based on schema
    const [fetchCurrentAdmin, { refetch: refetchAdminQuery }] = useLazyQuery<{ meAdmin: ApiAdmin | null }>(
        // IMPORTANT: Use the correct Query name 'meAdmin' from your schema/operations
        // Assuming GET_CURRENT_ADMIN actually contains the 'meAdmin' query
        GET_CURRENT_ADMIN,
        {
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
            onCompleted: (data) => {
                if (data?.meAdmin) {
                    console.log("Auth Check OK (fetchCurrentAdmin):", data.meAdmin.username);
                    setCurrentAdmin(data.meAdmin);
                    setIsAdmin(true);
                    setIsAuthenticated(true);
                } else {
                    console.log("Auth Check completed: No current admin returned by meAdmin query.");
                    // Only cleanup if a token was present, indicating an invalid/expired token
                    if (localStorage.getItem('jwt_token')) {
                        handleLogoutCleanup();
                    }
                }
                setAuthCheckComplete(true); // Mark check complete *after* processing data or lack thereof
            },
            onError: (error: ApolloError) => { // Type the error
                console.error("Auth Check Error (fetchCurrentAdmin):", error.message);
                // Distinguish between network and GraphQL errors if needed
                // if (error.networkError) { ... }
                // if (error.graphQLErrors) { ... }

                // Any error during the check means not authenticated
                handleLogoutCleanup(); // Clear state on error
                setAuthCheckComplete(true); // Mark check complete even on error
            }
        }
    );

    // Logout Mutation
    const [adminLogoutMutation, { loading: logoutLoading }] = useMutation<{ adminLogout: boolean }>(ADMIN_LOGOUT, {
        onCompleted: (data) => {
            if (data.adminLogout) {
                console.log("Server confirmed session revocation.");
                toast.info("You have been logged out.");
            } else {
                console.warn("Server indicated no session was revoked (might be already logged out/expired).");
                toast.info("Logged out.");
            }
            // Local cleanup is handled separately in the logout function *after* the mutation attempt
        },
        onError: (error) => {
            console.error("Error during adminLogout mutation:", error);
            toast.error("Logout failed on server. Clearing session locally.");
            // Local cleanup is still handled in the logout function
        },
        // Optional: Refetch public queries after logout
        // refetchQueries: [...]
    });

    // --- Helper for state cleanup ---
    const handleLogoutCleanup = useCallback(() => {
        console.log("Executing logout cleanup...");
        localStorage.removeItem('jwt_token');
        setToken(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCurrentAdmin(null);
        // Reset Apollo store to clear cached private data
        // Use clearStore instead of resetStore to avoid re-running queries
        client.clearStore().then(() => {
            console.log("Apollo store cleared.");
        }).catch(err => console.error("Error clearing Apollo store on logout cleanup:", err));
    }, [client]); // Dependency: client

    // Check for token on initial load
    useEffect(() => {
        // Ensure this runs only once on initial mount
        if (!initialCheckPerformed.current) {
            initialCheckPerformed.current = true; // Mark as performed
            const storedToken = localStorage.getItem('jwt_token');
            if (storedToken) {
                console.log("App Mount: Found token, initiating auth check...");
                setToken(storedToken);
                fetchCurrentAdmin(); // Validate the token with the backend
            } else {
                console.log("App Mount: No token found.");
                setAuthCheckComplete(true); // No token -> check is immediately complete (as not authenticated)
            }
        }
        // No dependencies needed here if it truly runs only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures it runs only once on mount


    // Login handler - Takes adminData directly from mutation result
    const login = useCallback((newToken: string, adminData: ApiAdmin) => {
        console.log(`AuthContext: login called for ${adminData.username}`);
        localStorage.setItem('jwt_token', newToken);
        setToken(newToken);
        setCurrentAdmin(adminData); // Use data from login mutation
        setIsAuthenticated(true);
        setIsAdmin(true); // Assuming login means admin rights
        setAuthCheckComplete(true); // Login successful, auth state is known

        // No need to call fetchCurrentAdmin here anymore
        // The necessary state is set directly from the mutation result
        // This avoids the race condition / 400 error post-login

    }, []); // No dependencies needed for this version

    // Logout handler
    const logout = useCallback(async () => {
        if (logoutLoading) return; // Prevent double clicks

        console.log("AuthContext: logout initiated");

        // 1. Attempt server-side logout (revoke token/session)
        try {
            await adminLogoutMutation();
            // onCompleted/onError handles server feedback logging/toast
        } catch (e) {
            // Catch potential hook errors (less likely)
            console.error("Exception calling logout mutation hook:", e);
            toast.error("An error occurred initiating logout. Clearing locally.");
        }

        // 2. Perform local cleanup *regardless* of mutation success/failure
        handleLogoutCleanup();

        // 3. Mark auth check as complete (now authenticated: false)
        setAuthCheckComplete(true);

        // Navigation to /login will happen automatically via ProtectedRoute
        // or the catch-all route checking isAuthenticated

    }, [adminLogoutMutation, handleLogoutCleanup, logoutLoading]); // Dependencies

    // Explicit refetch function (e.g., for profile updates)
    const refetchAdminData = useCallback(async (): Promise<ApolloQueryResult<{ meAdmin: ApiAdmin | null }>> => {
        if (!refetchAdminQuery) {
            console.warn("Refetch function (refetchAdminQuery) not available yet.");
            return Promise.reject(new Error("Refetch function not ready."));
        }
        console.log("Context: refetchAdminData called");
        try {
            // Optional: Clear cache *selectively* if needed, but usually network-only is sufficient
            // await client.clearStore(); // Avoid if possible
            const result = await refetchAdminQuery();
            console.log("Context: refetchAdminData completed.");
            // onCompleted/onError of useLazyQuery handles state updates based on result
            if (result.error || !result.data?.meAdmin) {
                 // If refetch fails or returns null, treat as logged out
                 handleLogoutCleanup();
                 setAuthCheckComplete(true); // Mark check complete
            }
            return result;
        } catch (error) {
            console.error("Error during explicit refetch (refetchAdminData):", error);
            handleLogoutCleanup(); // Cleanup on error
            setAuthCheckComplete(true); // Mark check complete
            // Rethrow or return a rejected promise matching the expected type
            return Promise.reject(error);
        }
    }, [refetchAdminQuery, client, handleLogoutCleanup]); // Add client and cleanup as dependencies


    // Initial loading state (only show if check is not complete AND a token exists)
    if (!authCheckComplete && token) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Authentication...</div>;
    }

    // Provide context value
    const authContextValue: AuthContextType = {
        isAuthenticated,
        isAdmin,
        token,
        admin: currentAdmin,
        login,
        logout,
        refetchAdminData,
        authCheckComplete
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="app">
                <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} limit={3} theme="colored" />
                <BrowserRouter>
                    <AppLayout>
                        <Routes>
                            {/* Public Login Route */}
                            <Route path="/login" element={
                                // If already authenticated and check is complete, redirect away from login
                                (authCheckComplete && isAuthenticated)
                                    ? <Navigate to="/dashboard" replace />
                                    : <LoginPage />
                            } />

                            {/* Protected Admin Routes */}
                            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                            <Route path="/movies" element={<ProtectedRoute><MoviesPage /></ProtectedRoute>} />
                            <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
                            <Route path="/actors" element={<ProtectedRoute><ActorsPage /></ProtectedRoute>} />
                            <Route path="/genres" element={<ProtectedRoute><GenresPage /></ProtectedRoute>} />
                            <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
                            <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                            <Route path="/comments" element={<ProtectedRoute><CommentsPage /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                            <Route path="/roles" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
                            <Route path="/storage" element={<ProtectedRoute><StoragePage /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                            {/* Catch-all Route - Redirect based on final auth state */}
                            <Route path="*" element={
                                // Wait for auth check before deciding the catch-all redirect
                                authCheckComplete ? (
                                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                                ) : (
                                    // If check isn't complete, show loading or a temporary state
                                    // Redirecting to login might be safest if unsure, but showing loading is better UX
                                     <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
                                )
                            } />
                        </Routes>
                    </AppLayout>
                </BrowserRouter>
            </div>
        </AuthContext.Provider>
    );
};

export default App;