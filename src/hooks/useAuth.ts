/**
 * Convenience re-export of the AuthContext hook.
 *
 * Kept as a separate file so screens can do:
 *   import { useAuth } from '@hooks/useAuth';
 * without caring where the context lives.
 */

import { useAuth as useAuthContext } from '@contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
