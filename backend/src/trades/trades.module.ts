import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeAuditLog } from './trade-audit-log.entity.js';
import { TradeGateway } from './trade-gateway.js';
import { Trade } from './trade.entity.js';
import { TradesController } from './trades.controller.js';
import { TradesService } from './trades.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trade, TradeAuditLog])],
  controllers: [TradesController],
  providers: [TradesService, TradeGateway],
  exports: [TradesService, TradeGateway],
})
export class TradesModule {}
