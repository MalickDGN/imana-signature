import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;
}

export class ShippingMethodDto {
  @IsIn(['standard', 'express'])
  code!: 'standard' | 'express';

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class PaymentDto {
  @IsIn(['cod', 'mobile'])
  method!: 'cod' | 'mobile';

  @ValidateIf((payment: PaymentDto) => payment.method === 'mobile')
  @IsIn(['wave', 'orange-money'])
  provider?: 'wave' | 'orange-money';
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ValidateNested()
  @Type(() => ShippingMethodDto)
  shippingMethod!: ShippingMethodDto;

  @ValidateNested()
  @Type(() => PaymentDto)
  payment!: PaymentDto;
}
