import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ADMIN_ROLES } from '../admin-auth/roles';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsArray()
  @IsIn(ADMIN_ROLES, { each: true })
  roles!: string[];
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(ADMIN_ROLES, { each: true })
  roles?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(12)
  password?: string;
}
