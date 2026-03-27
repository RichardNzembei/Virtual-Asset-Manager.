import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  wallet_id: string;

  @IsString()
  pair: string; // e.g. "BTC/tKES"

  @IsString()
  side: string; // BUY or SELL

  @IsString()
  type: string; // LIMIT or MARKET

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  time_in_force?: string;

  @IsOptional()
  @IsString()
  client_order_id?: string;
}
