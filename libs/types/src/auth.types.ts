export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
}

export interface AuthResponse {
  user: AuthUserDto;
  tokens: AuthTokens;
}
