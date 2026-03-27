import { IsString, IsOptional } from 'class-validator';

export class UpdateAlertDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  resolution_notes?: string;

  @IsOptional()
  @IsString()
  assigned_to?: string;
}
