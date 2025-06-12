// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    useLazyQuery,
    useApolloClient,
    ApolloQueryResult,
    // useMutation,
    ApolloError,
} from '@apollo/client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ApiAdmin } from '@interfaces/index';
import { GET_ADMIN } from '@graphql/index';

interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin: boolean;
    admin: ApiAdmin | null;
    login: (adminData: ApiAdmin) => void;
    logout: () => Promise<void>;
    refetchAdminData: () => Promise<ApolloQueryResult<{ admin: ApiAdmin | null }>>;
    authCheckComplete: boolean;
    isLoading: boolean;
}

const defaultRefetch = (): Promise<ApolloQueryResult<{ admin: ApiAdmin | null }>> => 
    Promise.reject(new Error("Refetch function not initialized"));

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isAdmin: false,
    admin: null,
    login: () => { console.warn('Login function not implemented') },
    logout: () => Promise.resolve(console.warn('Logout function not implemented')),
    refetchAdminData: defaultRefetch,
    authCheckComplete: false,
    isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState<ApiAdmin | null>(null);
    const [authCheckComplete, setAuthCheckComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const client = useApolloClient();
    const initialCheckPerformed = useRef(false);
    const navigate = useNavigate();

    const handleLogoutCleanup = useCallback(() => {
        console.log("Performing client-side logout cleanup.");
        setIsAuthenticated(false);
        setIsAdmin(false);
        setCurrentAdmin(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminId');
        client.clearStore().catch(error => console.error("Error clearing Apollo store on logout:", error));
    }, [client]);

    const [fetchAdmin, { refetch: refetchAdminQuery }] = useLazyQuery<{ admin: ApiAdmin | null }>(
        GET_ADMIN,
        {
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
            onCompleted: (data) => {
                if (data?.admin) {
                    console.log("Auth Check OK (fetchAdmin):", data.admin);
                    setCurrentAdmin(data.admin);
                    setIsAdmin(true);
                    setIsAuthenticated(true);
                } else {
                    console.log("Auth Check: No admin found with stored ID. Session might be invalid.");
                    handleLogoutCleanup();
                }
                setAuthCheckComplete(true);
                setIsLoading(false);
            },
            onError: (error: ApolloError) => {
                console.error("Auth Check Error (fetchAdmin):", error.message);
                handleLogoutCleanup();
                setAuthCheckComplete(true);
                setIsLoading(false);
            }
        }
    );

    const logout = useCallback(async () => {
        console.log("Initiating logout...");
        try {
            handleLogoutCleanup();
            navigate('/login');
            toast.info("You have been successfully logged out.");
        } catch (error) {
            console.error("Error during logout:", error);
            handleLogoutCleanup();
            navigate('/login');
        }
    }, [handleLogoutCleanup, navigate]);

    useEffect(() => {
        if (!initialCheckPerformed.current && !authCheckComplete) {
            initialCheckPerformed.current = true;
            
            const adminId = localStorage.getItem('adminId');
            const authToken = localStorage.getItem('authToken');
            
            console.log("[AUTH] Initial Auth Check:", { 
                adminId: adminId || "None", 
                hasToken: authToken ? "Yes" : "No",
                authCheckComplete,
                isAuthenticated,
                isAdmin
            });
            
            if (adminId) {
                console.log("[AUTH] Performing authentication check with stored admin ID:", adminId);
                fetchAdmin({ variables: { id: adminId } })
                    .then(result => {
                        console.log("[AUTH] Fetch admin result:", result);
                    })
                    .catch(err => {
                        console.error("[AUTH] Initial fetchAdmin call failed:", err.message);
                        setAuthCheckComplete(true);
                        setIsLoading(false);
                    });
            } else {
                console.log("[AUTH] No stored admin ID found, not authenticated");
                setAuthCheckComplete(true);
                setIsLoading(false);
            }
        }
    }, [fetchAdmin, authCheckComplete, isAuthenticated, isAdmin]);

    const login = useCallback((adminData: ApiAdmin) => {
        console.log("[AUTH] Login/Register successful, admin data received:", adminData);
        
        // Store admin ID for future auth checks
        localStorage.setItem('adminId', adminData.id);
        
        // Create a dummy token if backend doesn't provide one
        if (!localStorage.getItem('authToken')) {
            localStorage.setItem('authToken', `admin-session-${adminData.id}`);
        }
        
        setCurrentAdmin(adminData);
        setIsAdmin(true);
        setIsAuthenticated(true);
        setAuthCheckComplete(true);
        
        console.log("[AUTH] Auth state updated:", {
            hasAdminId: !!localStorage.getItem('adminId'),
            hasToken: !!localStorage.getItem('authToken'),
            isAuthenticated: true,
            isAdmin: true
        });
    }, []);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            isAdmin, 
            admin: currentAdmin, 
            login, 
            logout, 
            refetchAdminData: refetchAdminQuery, 
            authCheckComplete,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};