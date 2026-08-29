import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { TradeGateway } from './trade-gateway.js';
import type { Trade } from './trade.entity.js';
import { TradesService } from './trades.service.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Controller('trades')
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
    private readonly tradeGateway: TradeGateway,
  ) {}

  @Get()
  findAll(): Promise<Trade[]> {
    return this.tradesService.findAll();
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createTradeDto: CreateTradeDto): Promise<Trade> {
    const trade = await this.tradesService.create(createTradeDto);
    this.tradeGateway.notifyTradeCreated(trade);
    return trade;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateTrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeDto,
  ): Promise<Trade> {
    const trade = await this.tradesService.update(id, dto);
    this.tradeGateway.notifyTradeUpdated(trade);
    
    return trade;
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string): Promise<Trade> {
    const trade = await this.tradesService.cancel(Number(id));
    this.tradeGateway.notifyTradeCancelled(trade);
    return trade;
  }
}
