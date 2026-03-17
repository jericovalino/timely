import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Keeps the Neon DB connection warm by running a lightweight query every 4 minutes.
 * Neon free tier suspends after 5 minutes of inactivity, causing the first scan
 * after a quiet period to take 3–6 seconds (violating NFR-01: < 1s scan round-trip).
 */
@Injectable()
export class KeepaliveService {
  private readonly logger = new Logger(KeepaliveService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async keepDatabaseWarm() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.debug('DB keepalive ping sent');
    } catch (error) {
      this.logger.warn('DB keepalive ping failed', error);
    }
  }
}
