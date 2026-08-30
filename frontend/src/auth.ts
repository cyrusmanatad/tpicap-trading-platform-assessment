export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  traderId?: string;
  desk?: string;
};

export const AUTH_TOKEN_KEY = 'trading-desk-token';
export const AUTH_USER_KEY = 'trading-desk-user';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getUserDisplayName(user: AuthUser | null) {
  if (!user) {
    return 'Guest';
  }

  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (user.traderId) {
    return user.traderId;
  }

  const baseName = user.email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? 'User';
  if (!baseName) {
    return 'User';
  }

  return baseName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function buildAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
