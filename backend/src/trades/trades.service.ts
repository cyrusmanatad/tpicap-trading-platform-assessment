import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { Trade } from './trade.entity.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

const defaultTrades: Partial<Trade>[] = [
  {
    trade_uuid: '4c6ebc9f-5f8b-4a3c-90a1-8747d7d8f8a2',
    symbol: 'AAPL',
    quantity: 800,
    price: 214.54,
    side: 'BUY',
    trader: 'Alicia Chen',
    book: 'EQ-NA',
    counterparty: 'Morgan Stanley',
    tradeDate: new Date('2026-08-29T09:12:00Z'),
    status: 'ACTIVE',
  },
  {
    trade_uuid: '7ff0bc3a-4c82-4d67-b4ed-f55d8d5c8a91',
    symbol: 'MSFT',
    quantity: 450,
    price: 452.1,
    side: 'SELL',
    trader: 'Paul Lewis',
    book: 'EQ-NA',
    counterparty: 'JPMorgan',
    tradeDate: new Date('2026-08-29T08:48:00Z'),
    status: 'ACTIVE',
  },
  {
    trade_uuid: '3f4e0d44-1d43-41d7-a452-80d7245a7df2',
    symbol: 'NVDA',
    quantity: 1200,
    price: 126.87,
    side: 'BUY',
    trader: 'Priya Shah',
    book: 'EQ-QQQ',
    counterparty: 'Goldman Sachs',
    tradeDate: new Date('2026-08-28T17:42:00Z'),
    status: 'CANCELLED',
  },
  {
    trade_uuid: '0f5fb102-a05c-4006-bc4e-c6ec4d6374c9',
    symbol: 'TSLA',
    quantity: 620,
    price: 221.42,
    side: 'SELL',
    trader: 'Lucas Wong',
    book: 'EQ-NA',
    counterparty: 'UBS',
    tradeDate: new Date('2026-08-28T15:11:00Z'),
    status: 'ACTIVE',
  },
  {
    trade_uuid: '8c2b9462-0a21-4f50-b44d-6af7df7d9ae1',
    symbol: 'AMZN',
    quantity: 330,
    price: 191.83,
    side: 'BUY',
    trader: 'Sofia Gomez',
    book: 'EQ-NA',
    counterparty: 'Citi',
    tradeDate: new Date('2026-08-27T11:05:00Z'),
    status: 'ACTIVE',
  },
  {
    trade_uuid: '2d5ecdb8-f03d-44c5-8f1b-6dcb3f4f0807',
    symbol: 'META',
    quantity: 210,
    price: 525.2,
    side: 'SELL',
    trader: 'Daniel Park',
    book: 'EQ-NA',
    counterparty: 'Barclays',
    tradeDate: new Date('2026-08-27T08:25:00Z'),
    status: 'ACTIVE',
  },
];

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
    return this.tradeRepository.save(defaultTrades as Trade[]);
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
