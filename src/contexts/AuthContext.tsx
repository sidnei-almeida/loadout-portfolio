/**
 * Local-First AuthContext.
 *
 * Authentication state is derived entirely from MMKV:
 *  - `steamId` exists → user has logged in at least once
 *  - `hasSession` is true → cookies are (believed to be) valid
 *
 * No JWT, no /users/me, no backend dependency.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { storage } from '@services/storage';

// ---------------------------------------------------------------------------
// Sync-step UI (kept for the post-login sync overlay)
// ---------------------------------------------------------------------------

export interface SyncStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

const DEFAULT_SYNC_STEPS: SyncStep[] = [
  { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
  { id: 'prices', label: 'Updating price history', status: 'pending' },
  { id: 'load', label: 'Loading updated data', status: 'pending' },
];

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AuthContextType {
  steamId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (steamId: string) => void;
  logout: () => void;

  sessionExpired: boolean;
  clearSessionExpired: () => void;

  isPostLoginSyncing: boolean;
  postLoginSyncSteps: SyncStep[];
  updatePostLoginSyncStep: (stepId: string, status: SyncStep['status']) => void;
  setPostLoginSyncing: (syncing: boolean) => void;
  resetPostLoginSyncSteps: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [isPostLoginSyncing, setIsPostLoginSyncing] = useState(false);
  const [postLoginSyncSteps, setPostLoginSyncSteps] = useState<SyncStep[]>(DEFAULT_SYNC_STEPS);

  // Hydrate from MMKV on mount
  useEffect(() => {
    const storedId = storage.getSteamId();
    if (storedId && storage.getHasSession()) {
      setSteamId(storedId);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((id: string) => {
    storage.setSteamId(id);
    storage.setHasSession(true);
    setSteamId(id);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    setSteamId(null);
    setSessionExpired(false);
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const updatePostLoginSyncStep = useCallback(
    (stepId: string, status: SyncStep['status']) => {
      setPostLoginSyncSteps(prev =>
        prev.map(s => (s.id === stepId ? { ...s, status } : s)),
      );
    },
    [],
  );

  const setPostLoginSyncingCb = useCallback((syncing: boolean) => {
    setIsPostLoginSyncing(syncing);
  }, []);

  const resetPostLoginSyncSteps = useCallback(() => {
    setPostLoginSyncSteps(DEFAULT_SYNC_STEPS.map(s => ({ ...s })));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        steamId,
        isAuthenticated: !!steamId,
        isLoading,
        login,
        logout,
        sessionExpired,
        clearSessionExpired,
        isPostLoginSyncing,
        postLoginSyncSteps,
        updatePostLoginSyncStep,
        setPostLoginSyncing: setPostLoginSyncingCb,
        resetPostLoginSyncSteps,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
