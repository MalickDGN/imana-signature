import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateDeliveryZoneDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsNumber()
  @Min(0)
  priceFcfa!: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  odooShippingProductId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateDeliveryZoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceFcfa?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  odooShippingProductId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
