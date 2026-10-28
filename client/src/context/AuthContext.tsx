import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<{ success: boolean; devCode?: string; message: string }>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  setPendingPhone: (phone: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    authService
      .getCurrentUser()
      .then((currUser) => {
        if (!mounted) return;
        if (currUser) {
          setUser(currUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    setPendingPhone(phone);
    const res = await authService.sendOtp(phone);
    return res;
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!pendingPhone) {
      throw new Error('No pending phone number found. Please submit your phone number first.');
    }
    const res = await authService.verifyOtp(pendingPhone, code);
    setUser(res.user);
    setIsAuthenticated(true);
  }, [pendingPhone]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setPendingPhone(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        pendingPhone,
        requestOtp,
        verifyOtp,
        logout,
        setPendingPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
