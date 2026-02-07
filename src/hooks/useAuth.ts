/**
 * Hook customizado para autenticação
 */

import { useAuth as useAuthContext } from '@contexts/AuthContext';

export const useAuth = () => {
  const authContext = useAuthContext();

  const handleSteamLogin = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authContext.login(token);
        return { success: true };
    } catch (error) {
      console.error('[AUTH] Erro no login Steam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return {
    ...authContext,
    handleSteamLogin,
  };
};

