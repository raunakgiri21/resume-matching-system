/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwt: JwtService,
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

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }
}
