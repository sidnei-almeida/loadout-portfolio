import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { storage } from '@services/storage';
import { apiClient } from '@services/api';
import type { User } from '@types/user';

export interface SyncStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  // Estados para sincronização após login
  isPostLoginSyncing: boolean;
  postLoginSyncSteps: SyncStep[];
  updatePostLoginSyncStep: (stepId: string, status: SyncStep['status']) => void;
  setPostLoginSyncing: (syncing: boolean) => void;
  resetPostLoginSyncSteps: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isPostLoginSyncing, setIsPostLoginSyncing] = useState(false);
  const [postLoginSyncSteps, setPostLoginSyncSteps] = useState<SyncStep[]>([
    { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
    { id: 'prices', label: 'Updating price history', status: 'pending' },
    { id: 'load', label: 'Loading updated data', status: 'pending' },
  ]);
  const previousTokenRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (authToken: string) => {
    try {
      const userData = await apiClient.get<User>('/users/me', authToken);
      // Converter steam_id para string
      if (userData.steam_id) {
        userData.steam_id = String(userData.steam_id);
      }
      setUser(userData);
      await storage.setUser(userData);
      // Limpar flag de sessão expirada se login bem-sucedido
      setSessionExpired(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        // Marcar que a sessão expirou antes de limpar
        // Só marcar se havia um token anterior (não no primeiro load)
        if (previousTokenRef.current) {
          setSessionExpired(true);
        }
        setToken(null);
        setUser(null);
        await storage.clear();
      }
    }
  }, []);

  const loadStoredToken = useCallback(async () => {
    try {
      const storedToken = await storage.getToken();
      if (storedToken) {
        previousTokenRef.current = storedToken;
        setToken(storedToken);
        await loadUserData(storedToken);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

  const login = async (newToken: string) => {
    previousTokenRef.current = newToken;
    setToken(newToken);
    await storage.setToken(newToken);
    await loadUserData(newToken);
  };

  const logout = async () => {
    previousTokenRef.current = null;
    setToken(null);
    setUser(null);
    setSessionExpired(false); // Limpar flag ao fazer logout manual
    await storage.clear();
  };

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const updatePostLoginSyncStep = useCallback((stepId: string, status: SyncStep['status']) => {
    setPostLoginSyncSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  const setPostLoginSyncing = useCallback((syncing: boolean) => {
    setIsPostLoginSyncing(syncing);
  }, []);

  const resetPostLoginSyncSteps = useCallback(() => {
    setPostLoginSyncSteps([
      { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
      { id: 'prices', label: 'Updating price history', status: 'pending' },
      { id: 'load', label: 'Loading updated data', status: 'pending' },
    ]);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      logout, 
      isLoading, 
      sessionExpired,
      clearSessionExpired,
      isPostLoginSyncing,
      postLoginSyncSteps,
      updatePostLoginSyncStep,
      setPostLoginSyncing,
      resetPostLoginSyncSteps,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

