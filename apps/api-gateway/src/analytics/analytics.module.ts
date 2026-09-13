import { Module } from '@nestjs/common';
import {
  AdminAnalyticsController,
  PublicAnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminAnalyticsController, PublicAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
