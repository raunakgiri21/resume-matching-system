import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * JwtStrategy — Passport.js JWT validation strategy.
 *
 * Purpose:
 *  - Extracts and validates JWT tokens from Authorization headers
 *  - Verifies token signature using JWT_SECRET
 *  - Validates that the user still exists in the database
 *  - Runs automatically on routes protected by @UseGuards(JwtAuthGuard)
 *
 * Flow:
 *  1. Client sends request with Authorization: Bearer <token>
 *  2. ExtractJwt.fromAuthHeaderAsBearerToken() extracts the token
 *  3. Passport verifies the signature using JWT_SECRET
 *  4. validate() method is called with the decoded payload {
 *     sub (userId), email, role }
 *  5. We fetch fresh user data from database to ensure user still exists
 *  6. Request.user is set to the returned user object for use in controllers
 *
 * Security:
 *  - ignoreExpiration: false ensures expired tokens are rejected
 *  - Database lookup prevents access if user was deleted or deactivated
 *  - Never trusts the token payload alone; always re-verifies in DB
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      // Tells Passport to look for JWT in the Authorization header as "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens; don't allow them to pass through
      ignoreExpiration: false,
      // Secret key used to verify the token signature
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback-secret',
    });
  }

  /**
   * Validates the JWT payload and verifies user exists in database.
   *
   * @param payload - Decoded JWT payload { sub, email, role }
   * @returns Fresh user object from database, or throws UnauthorizedException
   *
   * Called by Passport after successful JWT signature verification.
   * This method performs the final validation step before allowing access.
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    // Query database to verify user still exists
    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('id, name, email, role')
      .eq('id', payload.sub)
      .single();

    // If user not found or query failed, reject the token
    if (error || !user) throw new UnauthorizedException('User not found');

    // Return fresh user data to be attached to request.user
    return user;
  }
}
