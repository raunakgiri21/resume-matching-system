import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback-secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('id, name, email, role')
      .eq('id', payload.sub)
      .single();
    if (error || !user) throw new UnauthorizedException('User not found');
    return user;
  }
}
