import { IsString, IsOptional } from 'class-validator';

export class BankSsoDto {
  @IsString()
  bank_token: string;

  @IsOptional()
  @IsString()
  bank_code?: string;
}
