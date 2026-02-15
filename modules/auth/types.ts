export interface AuthUser {
  mobile: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export type OtpPurpose = 'register' | 'reset';
