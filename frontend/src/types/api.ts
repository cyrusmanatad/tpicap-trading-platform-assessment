export interface ApiErrorShape {
  message?: string;
  status?: number;
}

export interface AuthSessionResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    traderId?: string;
    desk?: string;
  };
}
