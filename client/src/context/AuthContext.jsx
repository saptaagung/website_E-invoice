import { createContext, useContext, useState, useEffect } from 'react';
import { auth, getCurrentUser, setCurrentUser, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getCurrentUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated on mount
        const checkAuth = async () => {
            const storedUser = getCurrentUser();
            if (storedUser) {
                try {
                    const userData = await auth.me();
                    setUser(userData);
                    setCurrentUser(userData);
                } catch (error) {
                    // Token invalid, clear auth
                    setUser(null);
                    setToken(null);
                    setCurrentUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const data = await auth.login(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await auth.register(name, email, password);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        auth.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
