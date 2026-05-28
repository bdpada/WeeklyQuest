export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
