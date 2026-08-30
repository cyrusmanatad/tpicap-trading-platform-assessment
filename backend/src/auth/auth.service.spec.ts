import { describe, expect, it } from 'vitest';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { User } from './user.entity.js';

describe('AuthService', () => {
  it('registers a new user and returns a token with the rich desk profile', async () => {
    const repository = {
      findOne: async () => null,
      create: (value: Partial<User>) => value,
      save: async (value: Partial<User>) => ({
        id: 'user-1',
        email: value.email,
        password: value.password,
        firstName: value.firstName,
        lastName: value.lastName,
        traderId: value.traderId,
        desk: value.desk,
      }),
    } as unknown as Repository<User>;

    const jwtService = {
      signAsync: async (payload: Record<string, unknown>) => `token:${String(payload.email)}`,
    } as any;

    const service = new AuthService(repository, jwtService);

    const result = await service.register({
      email: 'alice@example.com',
      password: 'secret123',
      firstName: 'Alice',
      lastName: 'Ng',
      traderId: 'ALICE',
      desk: 'EQUITIES_US',
    });

    expect(result.access_token).toBe('token:alice@example.com');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.user.firstName).toBe('Alice');
    expect(result.user.lastName).toBe('Ng');
    expect(result.user.traderId).toBe('ALICE');
    expect(result.user.desk).toBe('EQUITIES_US');
  });
});
