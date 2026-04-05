import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — Protects routes that require JWT authentication.
 *
 * Purpose:
 *  - Enforces that requests include a valid JWT token in the Authorization header
 *  - Uses the 'jwt' strategy (JwtStrategy) to validate tokens
 *  - Automatically extracts and validates the token via Passport
 *  - Populates request.user with the authenticated user object
 *
 * Usage:
 *  @UseGuards(JwtAuthGuard)
 *  @Get('/profile')
 *  getProfile(@CurrentUser() user: User) { ... }
 *
 * Behavior:
 *  - If no token: returns 401 Unauthorized
 *  - If invalid/expired token: returns 401 Unauthorized
 *  - If valid token: calls JwtStrategy.validate() and sets request.user
 *
 * Note:
 *  - This is a "thin" guard that delegates all validation to JwtStrategy
 *  - For role-based access, combine with RolesGuard:
 *    @UseGuards(JwtAuthGuard, RolesGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
