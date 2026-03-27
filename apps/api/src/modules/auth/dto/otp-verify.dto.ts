import { IsString } from 'class-validator';

export class OtpSendDto {
  @IsString()
  phone: string;
}

export class OtpVerifyDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}
