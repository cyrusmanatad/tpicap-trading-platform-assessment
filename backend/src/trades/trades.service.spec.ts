import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorDisplayName } from './trade-audit.js';
import { TradesService } from './trades.service.js';

const actor = {
  id: 'user-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Ng',
  traderId: 'ALICE',
};

const sampleTrade = {
  id: 7,
  symbol: 'AAPL',
  quantity: 100,
  price: 150,
  side: 'BUY',
  trader: 'ALICE',
  book: 'EQUITIES_US',
  counterparty: 'GS',
  tradeDate: new Date('2026-09-16T10:00:00.000Z'),
  status: 'ACTIVE',
};

describe('TradesService', () => {
  let repository: any;
  let auditRepository: any;
  let service: TradesService;

  beforeEach(() => {
    repository = {
      count: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      create: vi.fn((value) => value),
      merge: vi.fn((current, updates) => ({ ...current, ...updates })),
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    auditRepository = {
      create: vi.fn((value) => value),
      save: vi.fn(async (value) => ({ id: 11, createdAt: new Date(), ...value })),
      find: vi.fn(),
    };

    service = new TradesService(repository, auditRepository);
  });

  it('seeds default trades when none exist', async () => {
    repository.count.mockResolvedValue(0);
    repository.save.mockResolvedValue([{ id: 'TRD-1001' }]);

    await service.seedIfEmpty();

    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalled();
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('applies server-side filters and sorting for trade queries', async () => {
    const qb = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[{ id: 1 }], 1]),
    };

    repository.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({
      search: 'aapl',
      side: 'BUY',
      status: 'ACTIVE',
      sort: 'notional',
      limit: 25,
      offset: 10,
    });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('trade');
    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.orderBy).toHaveBeenCalled();
    expect(qb.limit).toHaveBeenCalledWith(25);
    expect(qb.offset).toHaveBeenCalledWith(10);
    expect(result).toMatchObject({ items: [{ id: 1 }], total: 1, limit: 25, offset: 10 });
  });

  it('writes a create history row with actor snapshot and all booked fields', async () => {
    repository.save.mockImplementation(async (value) => ({ id: 7, status: 'ACTIVE', ...value }));

    await service.create(
      {
        symbol: 'AAPL',
        quantity: 100,
        price: 150,
        side: 'BUY',
        trader: 'ALICE',
        book: 'EQUITIES_US',
        counterparty: 'GS',
        tradeDate: '2026-09-16T10:00:00.000Z',
      },
      actor,
    );

    expect(auditRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tradeId: 7,
        action: 'CREATED',
        actorUserId: 'user-1',
        actorEmail: 'alice@example.com',
        actorName: 'Alice Ng',
        changes: expect.objectContaining({
          symbol: { from: null, to: 'AAPL' },
          quantity: { from: null, to: 100 },
        }),
      }),
    );
  });

  it('writes only changed fields and actor snapshot on update', async () => {
    repository.findOne.mockResolvedValue({ ...sampleTrade });
    repository.save.mockImplementation(async (value) => value);

    await service.update(7, { quantity: 250, price: 150 }, actor);

    expect(auditRepository.save).toHaveBeenCalledTimes(1);
    expect(auditRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tradeId: 7,
        action: 'UPDATED',
        actorUserId: 'user-1',
        actorEmail: 'alice@example.com',
        actorName: 'Alice Ng',
        changes: {
          quantity: { from: 100, to: 250 },
        },
      }),
    );
  });

  it('skips history when an update does not change audited fields', async () => {
    repository.findOne.mockResolvedValue({ ...sampleTrade });
    repository.save.mockImplementation(async (value) => value);

    await service.update(7, { quantity: 100, price: 150 }, actor);

    expect(repository.save).toHaveBeenCalled();
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('writes a cancel history row with the status change', async () => {
    repository.findOneBy.mockResolvedValue({ ...sampleTrade });
    repository.save.mockImplementation(async (value) => value);

    await service.cancel(7, actor);

    expect(auditRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tradeId: 7,
        action: 'CANCELLED',
        actorName: 'Alice Ng',
        changes: {
          status: { from: 'ACTIVE', to: 'CANCELLED' },
        },
      }),
    );
  });

  it('skips history when cancelling an already cancelled trade', async () => {
    repository.findOneBy.mockResolvedValue({ ...sampleTrade, status: 'CANCELLED' });
    repository.save.mockImplementation(async (value) => value);

    await service.cancel(7, actor);

    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('returns history newest first', async () => {
    const logs = [
      { id: 2, action: 'UPDATED' },
      { id: 1, action: 'CREATED' },
    ];
    repository.findOne.mockResolvedValue({ ...sampleTrade });
    auditRepository.find.mockResolvedValue(logs);

    const result = await service.findHistory(7);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(auditRepository.find).toHaveBeenCalledWith({
      where: { tradeId: 7 },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    expect(result).toEqual(logs);
  });

  it('throws when history is requested for a missing trade', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findHistory(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(auditRepository.find).not.toHaveBeenCalled();
  });
});

describe('actorDisplayName', () => {
  it('falls back from full name to trader id to email', () => {
    expect(actorDisplayName(actor)).toBe('Alice Ng');
    expect(actorDisplayName({ id: '1', email: 'a@x.com', firstName: 'Ada', traderId: 'ADA' })).toBe('Ada');
    expect(actorDisplayName({ id: '1', email: 'a@x.com', traderId: 'ADA' })).toBe('ADA');
    expect(actorDisplayName({ id: '1', email: 'a@x.com' })).toBe('a@x.com');
  });
});
