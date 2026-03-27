import { IsString, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  customer_id: string;

  @IsOptional()
  @IsString()
  wallet_type?: string;

  @IsOptional()
  @IsString()
  wallet_name?: string;
}
