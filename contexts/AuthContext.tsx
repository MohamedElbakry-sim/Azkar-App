
import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  syncData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dummy = {
    currentUser: null,
    loading: false,
    login: async () => {},
    signup: async () => {},
    logout: async () => {},
    syncData: async () => {},
    error: null,
    clearError: () => {},
    isDemoMode: true
  };

  return <AuthContext.Provider value={dummy}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
