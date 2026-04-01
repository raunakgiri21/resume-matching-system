import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlacementsModule } from './placements/placements.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    PlacementsModule,
    MatchingModule,
  ],
})
export class AppModule {}
