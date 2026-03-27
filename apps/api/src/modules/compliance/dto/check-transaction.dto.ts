import { IsString, IsNumber } from 'class-validator';

export class CheckTransactionDto {
  @IsString()
  customer_id: string;

  @IsString()
  transaction_type: string;

  @IsNumber()
  amount: number;
}
