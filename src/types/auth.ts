export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  initials: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  devCode?: string;
}

export interface VerifyOtpResponse {
  user: User;
  token: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
