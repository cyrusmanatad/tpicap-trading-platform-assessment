import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { Trade } from './trade.entity.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TradeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private emitFeedStatus(connected: boolean) {
    this.server.emit('feed-status', { connected });
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('feed-status', { connected: true });
    this.emitFeedStatus(true);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.emitFeedStatus(false);
  }

  notifyTradeCreated(trade: Trade) {
    this.server.emit('trade-created', trade);
  }

  notifyTradeUpdated(trade: Trade) {
    this.server.emit('trade-updated', trade);
  }

  notifyTradeCancelled(trade: Trade) {
    this.server.emit('trade-cancelled', trade);
  }
}
