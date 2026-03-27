import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class LinkBankAccountDto {
  @IsString()
  wallet_id: string;

  @IsString()
  customer_id: string;

  @IsString()
  account_number: string;

  @IsOptional()
  @IsString()
  bank_code?: string;

  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
