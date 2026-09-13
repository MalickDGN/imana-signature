import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
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
  /** Id of an active delivery_zones row (resolved server-side). */
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class PaymentDto {
  /** Code of an active payment_methods row (resolved server-side). */
  @IsString()
  @IsNotEmpty()
  method!: string;
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
