import { Module } from '@nestjs/common';
import {
  AdminAnalyticsController,
  PublicAnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AdminAnalyticsController, PublicAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
