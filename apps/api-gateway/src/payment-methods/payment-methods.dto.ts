import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z0-9_-]+$/, { message: 'code doit être en minuscules, chiffres, - ou _.' })
  code!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(40)
  provider!: string;

  @IsOptional()
  @IsIn(['order', 'delivery'])
  collectAt: 'order' | 'delivery' = 'order';

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  provider?: string;

  @IsOptional()
  @IsIn(['order', 'delivery'])
  collectAt?: 'order' | 'delivery';

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
