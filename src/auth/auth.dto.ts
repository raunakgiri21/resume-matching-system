import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.STUDENT;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
