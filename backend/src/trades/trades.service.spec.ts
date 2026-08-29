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
});
