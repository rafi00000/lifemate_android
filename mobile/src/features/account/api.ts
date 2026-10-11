import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { getSecureItem, SECURE_KEYS } from '@/services/storage/secure-storage';
import { useAuth } from '@/store/auth';
import type { User } from '@/types/api';

export function useUpdateName() {
  return useMutation({
    mutationFn: (name: string) => api.patch<User>('/users/me', { name }),
    onSuccess: (user) => useAuth.getState().setUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      // Sending our refresh token keeps this device signed in while every
      // other device is signed out.
      const refreshToken = (await getSecureItem(SECURE_KEYS.refreshToken)) ?? undefined;
      return api.post<{ accessToken: string }>('/users/me/password', { ...input, refreshToken });
    },
    onSuccess: ({ accessToken }) => useAuth.getState().setAccessToken(accessToken),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => api.delete('/users/me', { password }),
    onSuccess: () => useAuth.getState().signOut(),
  });
}
