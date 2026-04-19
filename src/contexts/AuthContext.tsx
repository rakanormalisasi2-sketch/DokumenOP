import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (code: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CODE = 'bidangop';
const RESPONDENT_CODE = '122333';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('docms_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((code: string): boolean => {
    let role: UserRole | null = null;
    let userId: string = '';
    let userName: string = '';

    if (code === ADMIN_CODE) {
      role = 'admin';
      userId = 'admin1';
      userName = 'Administrator';
    } else if (code === RESPONDENT_CODE) {
      // Match with sample submission that has status 'approved' (resp2 - CV Karya Mandiri)
      role = 'respondent';
      userId = 'resp2';
      userName = 'CV Karya Mandiri';
    }

    if (role) {
      const newUser: User = {
        id: userId,
        role,
        code,
        name: userName,
        createdAt: new Date(),
      };
      setUser(newUser);
      localStorage.setItem('docms_user', JSON.stringify(newUser));
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('docms_user');
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
