import { apiClient } from './apiClient';
import type { UserProfile } from '../types/user';

export function getMyProfile() {
  return apiClient<{ user: UserProfile }>('/users/me');
}

export function updateMyProfile(displayName: string) {
  return apiClient<{ user: UserProfile }>('/users/me/profile', {
    method: 'PUT',
    body: { displayName },
  });
}

export function updateMyPassword(currentPassword: string, newPassword: string) {
  return apiClient<{ message: string }>('/users/me/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });
}

export function updateMyEmail(email: string, currentPassword: string) {
  return apiClient<{ user: UserProfile }>('/users/me/email', {
    method: 'PUT',
    body: { email, currentPassword },
  });
}
