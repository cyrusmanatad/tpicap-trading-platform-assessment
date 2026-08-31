import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly windowMs = 60_000;
  private static readonly maxRequests = 20;
  private static readonly requests = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string; res?: { setHeader: (key: string, value: string | number) => void } }>();
    const ip = request.ip ?? request.res?.toString() ?? 'unknown';
    const now = Date.now();
    const timestamps = RateLimitGuard.requests.get(ip) ?? [];
    const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < RateLimitGuard.windowMs);

    if (recentTimestamps.length >= RateLimitGuard.maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((recentTimestamps[0] + RateLimitGuard.windowMs - now) / 1000));
      request.res?.setHeader('Retry-After', String(retryAfter));
      request.res?.setHeader('X-RateLimit-Limit', String(RateLimitGuard.maxRequests));
      request.res?.setHeader('X-RateLimit-Remaining', '0');
      throw new HttpException(
        `Too many requests. Retry after ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentTimestamps.push(now);
    RateLimitGuard.requests.set(ip, recentTimestamps);
    request.res?.setHeader('X-RateLimit-Limit', String(RateLimitGuard.maxRequests));
    request.res?.setHeader('X-RateLimit-Remaining', String(Math.max(0, RateLimitGuard.maxRequests - recentTimestamps.length)));
    return true;
  }
}
