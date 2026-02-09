export * from './database';

export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
};
