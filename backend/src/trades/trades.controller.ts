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
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateTradeDto } from './dto/create-trade.dto.js';
import { FindTradesQueryDto } from './dto/find-trades-query.dto.js';
import type { AuditActor } from './trade-audit.js';
import { TradeAuditLog } from './trade-audit-log.entity.js';
import { TradeGateway } from './trade-gateway.js';
import type { Trade } from './trade.entity.js';
import { TradesService } from './trades.service.js';
import { UpdateTradeDto } from './dto/update-trade.dto.js';

type AuthenticatedRequest = {
  user: AuditActor;
};

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

  @Get(':id/history')
  findHistory(@Param('id', ParseIntPipe) id: number): Promise<TradeAuditLog[]> {
    return this.tradesService.findHistory(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createTradeDto: CreateTradeDto, @Req() req: AuthenticatedRequest): Promise<Trade> {
    const trade = await this.tradesService.create(createTradeDto, req.user);
    this.tradeGateway.notifyTradeCreated(trade);
    return trade;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateTrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Trade> {
    const trade = await this.tradesService.update(id, dto, req.user);
    this.tradeGateway.notifyTradeUpdated(trade);

    return trade;
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest): Promise<Trade> {
    const trade = await this.tradesService.cancel(id, req.user);
    this.tradeGateway.notifyTradeCancelled(trade);
    return trade;
  }
}
