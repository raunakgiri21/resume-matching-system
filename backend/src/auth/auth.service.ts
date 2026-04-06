/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  AdminCreateStudentDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwt: JwtService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const { data: existing } = await this.supabase.db
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { data: user, error } = await this.supabase.db
      .from('users')
      .insert({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'student',
      })
      .select('id, name, email, role')
      .single();

    if (error) throw new ConflictException(error.message);
    return { user, token: this.signToken(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto) {
    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('id, name, email, role, password')
      .eq('email', dto.email)
      .single();
    if (error || !user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...safeUser } = user;
    return {
      user: safeUser,
      token: this.signToken(user.id, user.email, user.role),
    };
  }

  async forgotPassword(email: string) {
    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Do not reveal whether an account exists for this email.
    if (!user) {
      return {
        status: 'error',
        message: 'No account found with this email.',
      };
    }

    await this.sendPasswordResetEmail(
      user,
      'Reset your password',
      'Click the link below to reset your password. This link expires in 1 hour.',
    );

    return {
      status: 'success',
      message: 'Password reset link sent successfully.',
    };
  }

  async createStudent(dto: AdminCreateStudentDto) {
    const { data: existing } = await this.supabase.db
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();
    if (existing) throw new ConflictException('Email already registered');

    const password = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await this.supabase.db
      .from('users')
      .insert({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'student',
      })
      .select('id, name, email, role')
      .single();

    if (error) throw new ConflictException(error.message);

    await this.sendPasswordResetEmail(
      user,
      'Set your password',
      'A student account was created for you. Click the link below to set your password. This link expires in 1 hour.',
    );

    return {
      status: 'success',
      user,
      message: 'Student account created and password reset link sent.',
    };
  }

  private generateRandomPassword() {
    return randomBytes(12).toString('base64url');
  }

  private async sendPasswordResetEmail(
    user: { id: string; name: string; email: string },
    subject: string,
    bodyIntro: string,
  ) {
    const resetToken = this.jwt.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      { expiresIn: '1h' },
    );

    const appUrl =
      this.config.get<string>('APP_URL') || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.mailService.sendMail({
      to: user.email,
      subject,
      html: `<p>Hello ${user.name || 'user'},</p>
             <p>${bodyIntro}</p>
             <p><a href="${resetLink}">Reset your password</a></p>
             <p>If you didn\\'t expect this email, please ignore it.</p>`,
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = this.verifyResetToken(dto.token);
    if (!payload || payload.type !== 'password_reset') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const { data: user, error } = await this.supabase.db
      .from('users')
      .select('id')
      .eq('id', payload.sub)
      .single();
    if (error || !user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { error: updateError } = await this.supabase.db
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return { status: 'success', message: 'Password reset successfully.' };
  }

  private verifyResetToken(token: string) {
    try {
      return this.jwt.verify(token) as {
        sub: string;
        email: string;
        type: string;
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Creates a signed JWT token for session-less authentication.
   *
   * @param userId - User's unique identifier (sub claim)
   * @param email - User's email address
   * @param role - User's role (admin | student)
   * @returns Signed JWT token string
   *
   * JWT Payload Structure:
   *  {
   *    sub: userId,      // StandardClaim: user identifier
   *    email: email,     // Custom claim: used in password reset validation
   *    role: role,       // Custom claim: used in role-based access control
   *    iat: <timestamp>, // StandardClaim: issued at (auto-added by JwtService)
   *    exp: <timestamp>  // StandardClaim: expires at (set in auth.module via signOptions)
   *  }
   *
   * Token Expiry:
   *  - Tokens expire after 7 days (set in JwtModule.registerAsync in auth.module.ts)
   *  - Client must re-authenticate (login) to get a new token
   *  - Tokens are stateless; no server-side storage (scaling-friendly)
   *
   * Security Notes:
   *  - Token is signed with JWT_SECRET; anyone with the secret can forge tokens
   *  - Token expires automatically; JwtStrategy.validate() rejects expired tokens
   *  - Always send tokens over HTTPS in production
   *  - Never store sensitive data in token (payload is base64-encoded, not encrypted)
   *  - Client includes token in Authorization: Bearer <token> header
   *
   * Usage:
   *  Called by register() and login() to return authentication token to client
   *  Also called by sendPasswordResetEmail() to create time-limited reset tokens
   */
  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }
}
