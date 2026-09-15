import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import { TradeGateway } from './trade-gateway.js';

const require = createRequire(import.meta.url);
const { io } = require('../../../frontend/node_modules/socket.io-client') as {
  io: (url: string, opts?: Record<string, unknown>) => {
    connected: boolean;
    on: (event: string, handler: (...args: any[]) => void) => void;
    once: (event: string, handler: (...args: any[]) => void) => void;
    connect: () => void;
    disconnect: () => void;
  };
};

function createClient(id: string) {
  return { id, emit: vi.fn() };
}

@Module({
  providers: [TradeGateway],
})
class GatewayTestModule {}

describe('TradeGateway feed status', () => {
  it('keeps remaining clients live when another client disconnects', () => {
    const gateway = new TradeGateway();
    gateway.server = { emit: vi.fn() } as any;

    const clientA = createClient('a');
    const clientB = createClient('b');

    gateway.handleConnection(clientA as any);
    gateway.handleConnection(clientB as any);

    expect(clientA.emit).toHaveBeenCalledWith('feed-status', { connected: true });
    expect(clientB.emit).toHaveBeenCalledWith('feed-status', { connected: true });
    expect(gateway.server.emit).not.toHaveBeenCalledWith('feed-status', expect.anything());

    gateway.handleDisconnect(clientA as any);

    expect(gateway.server.emit).not.toHaveBeenCalledWith('feed-status', { connected: false });

    gateway.handleDisconnect(clientB as any);

    expect(gateway.server.emit).toHaveBeenCalledWith('feed-status', { connected: false });
  });
});

describe('TradeGateway two live sockets', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GatewayTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    port = address.port;
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not send feed-status false to a remaining client', async () => {
    const url = `http://127.0.0.1:${port}`;
    const remainingStatuses: Array<boolean | undefined> = [];

    const clientA = io(url, { transports: ['websocket'], reconnection: false });
    const clientB = io(url, { transports: ['websocket'], reconnection: true });

    clientB.on('feed-status', (status: { connected?: boolean }) => {
      remainingStatuses.push(status?.connected);
    });

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        clientA.once('connect', () => resolve());
        clientA.once('connect_error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        clientB.once('connect', () => resolve());
        clientB.once('connect_error', reject);
      }),
    ]);

    expect(remainingStatuses.at(-1)).toBe(true);

    clientA.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(clientB.connected).toBe(true);
    expect(remainingStatuses).not.toContain(false);

    clientB.disconnect();
    clientB.connect();

    await new Promise<void>((resolve, reject) => {
      clientB.once('connect', () => resolve());
      clientB.once('connect_error', reject);
    });

    expect(clientB.connected).toBe(true);
    expect(remainingStatuses.at(-1)).toBe(true);

    clientB.disconnect();
  });
});
