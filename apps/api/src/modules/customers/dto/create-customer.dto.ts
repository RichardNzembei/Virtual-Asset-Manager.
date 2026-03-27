import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  national_id?: string;

  @IsOptional()
  @IsString()
  bank_cif?: string;

  @IsOptional()
  @IsInt()
  @Min(0) @Max(3)
  kyc_level?: number;
}
