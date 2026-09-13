import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'whatsapp'];
const STATUSES = ['draft', 'scheduled', 'published', 'failed'];

export class CreateSocialPublicationDto {
  @IsString()
  @MaxLength(220)
  title!: string;

  @IsString()
  body!: string;

  @IsIn(PLATFORMS)
  platform!: string;

  @IsOptional()
  @IsIn(STATUSES)
  status: string = 'draft';

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  mediaId?: string;
}

export class UpdateSocialPublicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsIn(PLATFORMS)
  platform?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  mediaId?: string;
}
