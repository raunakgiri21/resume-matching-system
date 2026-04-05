import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() branch?: string;
  @IsString() @IsOptional() graduation_year?: string;
  @IsString() @IsOptional() skills?: string;
  @IsUrl() @IsOptional() linkedin_url?: string;
}
