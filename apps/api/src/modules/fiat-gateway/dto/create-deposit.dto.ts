import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDepositDto {
  @IsString()
  wallet_id: string;

  @IsString()
  source_account_id: string;

  @IsNumber()
  @Min(500)
  amount: number;

  @IsOptional()
  @IsString()
  target_asset?: string;

  @IsOptional()
  @IsString()
  deposit_method?: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
