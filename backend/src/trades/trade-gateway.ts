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

  private connectedCount = 0;

  handleConnection(client: Socket) {
    this.connectedCount += 1;
    console.log(`Client connected: ${client.id}`);
    client.emit('feed-status', { connected: true });
  }

  handleDisconnect(client: Socket) {
    this.connectedCount = Math.max(0, this.connectedCount - 1);
    console.log(`Client disconnected: ${client.id}`);

    // Remaining dashboards keep their own live status. Only signal feed-down
    // when the last client has left (no open sockets remain to mark false).
    if (this.connectedCount === 0) {
      this.server.emit('feed-status', { connected: false });
    }
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
