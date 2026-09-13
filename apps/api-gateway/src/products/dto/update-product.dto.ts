import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
