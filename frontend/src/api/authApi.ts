import { api } from './index';
import type { AuthSessionResponse } from '../types/api';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  firstName?: string;
  lastName?: string;
  traderId?: string;
  desk?: string;
}

export async function login(payload: AuthCredentials): Promise<AuthSessionResponse> {
  const { data } = await api.post<AuthSessionResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthSessionResponse> {
  const { data } = await api.post<AuthSessionResponse>('/auth/register', payload);
  return data;
}
