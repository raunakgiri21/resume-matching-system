/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — Enforces role-based access control (RBAC).
 *
 * Purpose:
 *  - Checks if the authenticated user has one of the required roles
 *  - Works in conjunction with @Roles() decorator to specify allowed roles
 *  - Must be used AFTER JwtAuthGuard to ensure user is authenticated
 *
 * How it works:
 *  1. Uses Reflector to read @Roles() metadata from the controller method/class
 *  2. If no @Roles() is set, allows all authenticated users (returns true)
 *  3. If @Roles() is set, checks if user.role is in the allowed roles list
 *  4. Returns true if user has required role, false otherwise (403 Forbidden)
 *
 * Usage:
 *  @UseGuards(JwtAuthGuard, RolesGuard)  // JwtAuthGuard MUST come first
 *  @Roles(Role.ADMIN)                     // Only admins allowed
 *  @Post('/admin/create-student')
 *  createStudent(...) { ... }
 *
 *  @UseGuards(JwtAuthGuard, RolesGuard)
 *  @Roles(Role.ADMIN, Role.STUDENT)      // Both admins and students allowed
 *  @Get('/profile')
 *  getProfile(...) { ... }
 *
 * Guard Order:
 *  - ALWAYS place RolesGuard AFTER JwtAuthGuard in @UseGuards()
 *  - Without JwtAuthGuard first, request.user won't exist
 *  - If you only use RolesGuard alone, it allows unauthenticated users through
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has permission to access this route.
   *
   * @param context - The request context containing handler metadata and request
   * @returns true if user is allowed (either no roles required or user has one),
   *          false otherwise, which triggers 403 Forbidden response
   *
   * Execution context allows us to:
   *  - Read metadata (@Roles decorator)
   *  - Access the request object to get the authenticated user
   */
  canActivate(context: ExecutionContext): boolean {
    // Read @Roles() metadata from method or class. Looks in method first, then class.
    // If neither has @Roles, requiredRoles will be undefined.
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required (@Roles not used), allow access for all authenticated users
    if (!requiredRoles) return true;

    // Get the authenticated user from the request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Check if user's role is in the list of allowed roles
    // Returns true if match found, false otherwise
    return requiredRoles.includes(user?.role);
  }
}
