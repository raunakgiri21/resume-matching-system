import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PlacementStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  COMPLETED = 'completed',
}

export class CreatePlacementDto {
  @IsString() @IsNotEmpty() company_name: string;
  @IsString() @IsNotEmpty() role_title: string;
  @IsString() @IsNotEmpty() job_description: string;
  @IsNumber() @Min(0) @Type(() => Number) ctc_lpa: number;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() required_skills?: string;
  @IsString() @IsOptional() eligibility_criteria?: string;
  @IsDateString() @IsOptional() last_date?: string;
}

export class UpdatePlacementDto {
  @IsString() @IsOptional() company_name?: string;
  @IsString() @IsOptional() role_title?: string;
  @IsString() @IsOptional() job_description?: string;
  @IsNumber() @Min(0) @Type(() => Number) @IsOptional() ctc_lpa?: number;
  @IsString() @IsOptional() location?: string;
  @IsString() @IsOptional() required_skills?: string;
  @IsString() @IsOptional() eligibility_criteria?: string;
  @IsDateString() @IsOptional() last_date?: string;
  @IsEnum(PlacementStatus) @IsOptional() status?: PlacementStatus;
}
