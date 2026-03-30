import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class SubmitAssetDto {
  @IsString()
  asset_type: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  token_symbol: string;

  @IsString()
  token_name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_supply?: number; // Optional — calculated in Phase 3 from asset_value / token_price

  @IsOptional()
  @IsNumber()
  @Min(0)
  token_price_kes?: number; // Defaults to KES 100

  @IsNumber()
  @Min(0)
  asset_value_kes: number;

  @IsOptional()
  @IsNumber()
  min_investment_kes?: number;

  @IsOptional()
  @IsNumber()
  expected_yield?: number;

  @IsOptional()
  @IsString()
  distribution_frequency?: string;

  @IsOptional()
  @IsNumber()
  lock_up_days?: number;

  // Real estate fields
  @IsOptional()
  @IsString()
  property_type?: string;

  @IsOptional()
  @IsString()
  property_address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  title_number?: string;

  @IsOptional()
  @IsNumber()
  rental_income_monthly_kes?: number;

  @IsOptional()
  @IsNumber()
  occupancy_rate?: number;

  @IsOptional()
  @IsString()
  spv_name?: string;
}
