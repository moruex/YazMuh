// src/pages/app/App.tsx

import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import '@src/index.css';
import '@styles/components/Sidebar.css';

import Sidebar from "@components/sidebar/Sidebar";
import { MenuIcon } from 'lucide-react';
import MobileSidebar from '@components/sidebar/MobileSidebar';
import Header from '@pages/app/Header';
import Breadcrumbs from '@pages/app/Breadcrumbs';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
import { useAuth } from '@contexts/AuthContext';

// --- Protected Route Component ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, authCheckComplete } = useAuth();
    const location = useLocation();

    if (!authCheckComplete) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Checking Authentication...</div>;
    }

    if (!isAuthenticated) {
        console.log("ProtectedRoute: Not authenticated, redirecting to /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
};

// --- App Layout Component ---
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [responsive, setResponsive] = useState<string>('minimized');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();
    const { isAuthenticated, admin } = useAuth();

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
                                    {admin?.username && <span>{admin.username}</span>}
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
    const { authCheckComplete } = useAuth();

    if (!authCheckComplete) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Initializing Application...</div>;
    }

    return (
        <div className="app">
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} limit={3} theme="colored" />
            <AppLayout>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
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
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AppLayout>
        </div>
    );
};

export default App;