import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TradesService } from './trades.service.js';

describe('TradesService', () => {
  let repository: any;
	let service: TradesService;

  beforeEach(() => {
    repository = {
      count: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      create: vi.fn((value) => value),
      merge: vi.fn((current, updates) => ({ ...current, ...updates })),
      findOneBy: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    service = new TradesService(repository);
  });

  it('seeds default trades when none exist', async () => {
    repository.count.mockResolvedValue(0);
    repository.save.mockResolvedValue([{ id: 'TRD-1001' }]);

    await service.seedIfEmpty();

    expect(repository.count).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalled();
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
});
