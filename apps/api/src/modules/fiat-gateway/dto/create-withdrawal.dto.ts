import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsString()
  wallet_id: string;

  @IsString()
  destination_account_id: string;

  @IsOptional()
  @IsString()
  source_asset?: string;

  @IsNumber()
  @Min(100)
  source_amount: number;

  @IsOptional()
  @IsString()
  withdrawal_method?: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
