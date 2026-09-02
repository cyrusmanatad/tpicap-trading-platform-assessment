import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import * as os from 'node:os';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; app: string, hostname: string } {
    return {
      status: 'ok',
      app: 'trading-platform',
      hostname: os.hostname()
    };
  }
}
