import { IsString, IsNumber, Min } from 'class-validator';

export class InvestDto {
  @IsString()
  wallet_id: string;

  @IsNumber()
  @Min(100)
  amount_kes: number;
}
