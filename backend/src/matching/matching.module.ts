import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { AiModule } from '../ai/ai.module';
import { PlacementsModule } from '../placements/placements.module';

@Module({
  imports: [AiModule, PlacementsModule],
  providers: [MatchingService],
  controllers: [MatchingController],
})
export class MatchingModule {}
