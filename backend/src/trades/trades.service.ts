import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { FindTradesQueryDto } from './dto/find-trades-query.dto.js';
import { Trade } from './trade.entity.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

const resolveSeedFile = () => {
  const candidates = [
    path.join(process.cwd(), 'src', 'trades', 'default-trades.json'),
    path.join(process.cwd(), 'dist', 'trades', 'default-trades.json'),
    path.join(process.cwd(), 'backend', 'src', 'trades', 'default-trades.json'),
  ];

  const file = candidates.find((candidate) => existsSync(candidate));

  if (!file) {
    throw new Error('Unable to locate default-trades.json for seed data.');
  }

  return file;
};

const defaultTrades = JSON.parse(readFileSync(resolveSeedFile(), 'utf8')) as Array<
  Partial<Trade> & {
    tradeDate: string | Date;
  }
>;

const normalizedDefaultTrades: Partial<Trade>[] = defaultTrades.map((trade) => ({
  ...trade,
  tradeDate: new Date(trade.tradeDate),
}));

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {}

  private buildFilterQuery(query: FindTradesQueryDto = {}): SelectQueryBuilder<Trade> {
    const qb = this.tradeRepository.createQueryBuilder('trade');
    const search = query.search?.trim().toLowerCase();

    if (search) {
      qb.andWhere(
        `(
          LOWER(trade.symbol) LIKE :search OR
          LOWER(trade.trader) LIKE :search OR
          LOWER(trade.counterparty) LIKE :search OR
          CAST(trade.id AS TEXT) LIKE :search OR
          LOWER(CAST(trade.trade_uuid AS TEXT)) LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    if (query.side) {
      qb.andWhere('trade.side = :side', { side: query.side });
    }

    if (query.status) {
      qb.andWhere('trade.status = :status', { status: query.status });
    }

    return qb;
  }

  async findAll(query: FindTradesQueryDto = {}): Promise<{ items: Trade[]; total: number; limit: number; offset: number }> {
    const qb = this.buildFilterQuery(query);
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const sort = query.sort ?? 'timestamp';

    switch (sort) {
      case 'symbol':
        qb.orderBy('LOWER(trade.symbol)', 'ASC');
        qb.addOrderBy('trade.tradeDate', 'DESC');
        break;
      case 'notional':
        qb.orderBy('(trade.quantity * trade.price)', 'DESC');
        qb.addOrderBy('trade.tradeDate', 'DESC');
        break;
      case 'timestamp':
      default:
        qb.orderBy('trade.tradeDate', 'DESC');
        break;
    }

    qb.limit(limit).offset(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset };
  }

  async getSummary(query: FindTradesQueryDto = {}): Promise<{
    total: number;
    notional: number;
    active: number;
    cancelled: number;
    buyVolume: number;
    sellVolume: number;
  }> {
    const trades = await this.buildFilterQuery(query).getMany();

    const notional = trades.reduce((sum, trade) => sum + (trade.quantity ?? 0) * (trade.price ?? 0), 0);
    const buyVolume = trades
      .filter((trade) => trade.side === 'BUY' && trade.status === 'ACTIVE')
      .reduce((sum, trade) => sum + (trade.quantity ?? 0), 0);
    const sellVolume = trades
      .filter((trade) => trade.side === 'SELL' && trade.status === 'ACTIVE')
      .reduce((sum, trade) => sum + (trade.quantity ?? 0), 0);
    const active = trades.filter((trade) => trade.status === 'ACTIVE').length;
    const cancelled = trades.filter((trade) => trade.status === 'CANCELLED').length;

    return {
      total: trades.length,
      notional,
      active,
      cancelled,
      buyVolume,
      sellVolume,
    };
  }

  async seedIfEmpty(): Promise<Trade[]> {
    const count = await this.tradeRepository.count();
    if (count > 0) {
      return this.tradeRepository.find({
        order: {
          tradeDate: 'DESC',
        },
      });
    }

    this.logger.log('Seeding initial trade data');
    return this.tradeRepository.save(normalizedDefaultTrades as Trade[]);
  }

  async create(createTradeDto: CreateTradeDto): Promise<Trade> {
    const normalizedTradeUuid = createTradeDto.trade_uuid ?? crypto.randomUUID();

    this.logger.debug({
      ...createTradeDto,
      trade_uuid: normalizedTradeUuid,
      tradeDate: new Date(createTradeDto.tradeDate),
    });

    const trade = this.tradeRepository.create({
      ...createTradeDto,
      trade_uuid: normalizedTradeUuid,
      tradeDate: new Date(createTradeDto.tradeDate),
    });

    return this.tradeRepository.save(trade);
  }

  async update(id: number, dto: UpdateTradeDto): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({ where: { id } });

    if (!trade) {
      throw new NotFoundException(`Trade ${id} not found`);
    }

    this.logger.debug(dto.status);

    const {
      id: _ignoredId,
      trade_uuid: _ignoredTradeUuid,
      createdAt: _ignoredCreatedAt,
      updatedAt: _ignoredUpdatedAt,
      ...safeUpdates
    } = dto as any;

    Object.assign(trade, safeUpdates);

    return this.tradeRepository.save(trade);
  }

  async cancel(id: number): Promise<Trade> {
    const trade = await this.tradeRepository.findOneBy({ id: Number(id) });

    if (!trade) {
      throw new NotFoundException(`Trade ${id} not found`);
    }

    trade.status = 'CANCELLED';

    return this.tradeRepository.save(trade);
  }

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }
}
