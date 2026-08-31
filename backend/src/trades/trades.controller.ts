import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { FindTradesQueryDto } from './dto/find-trades-query.dto.js';
import { TradeGateway } from './trade-gateway.js';
import type { Trade } from './trade.entity.js';
import { TradesService } from './trades.service.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
    private readonly tradeGateway: TradeGateway,
  ) {}

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: FindTradesQueryDto,
  ): Promise<{ items: Trade[]; total: number; limit: number; offset: number }> {
    return this.tradesService.findAll(query);
  }

  @Get('summary')
  getSummary(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: FindTradesQueryDto,
  ): Promise<{
    total: number;
    notional: number;
    active: number;
    cancelled: number;
    buyVolume: number;
    sellVolume: number;
  }> {
    return this.tradesService.getSummary(query);
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
