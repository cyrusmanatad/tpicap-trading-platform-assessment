import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto.js';
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

  async findAll(): Promise<Trade[]> {
    return this.tradeRepository.find({
      order: {
        tradeDate: 'DESC',
      },
    });
  }

  async seedIfEmpty(): Promise<Trade[]> {
    const count = await this.tradeRepository.count();
    if (count > 0) {
      return this.findAll();
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
