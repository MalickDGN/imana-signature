import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TrackAnalyticsEventDto {
  @IsIn([
    'page_view',
    'session_start',
    'add_to_cart',
    'checkout_started',
    'conversion',
  ])
  eventName!:
    | 'page_view'
    | 'session_start'
    | 'add_to_cart'
    | 'checkout_started'
    | 'conversion';

  @IsString()
  @MaxLength(120)
  visitorId!: string;

  @IsString()
  @MaxLength(120)
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  campaign?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999_999_999_999)
  valueFcfa?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateCampaignDto {
  @IsString()
  @MaxLength(180)
  name!: string;

  @IsIn(['seo', 'email', 'social', 'paid', 'affiliate', 'other'])
  channel!: 'seo' | 'email' | 'social' | 'paid' | 'affiliate' | 'other';

  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status: 'draft' | 'active' | 'paused' | 'completed' = 'draft';

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetFcfa = 0;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @IsString()
  @MaxLength(160)
  utmCampaign!: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsIn(['seo', 'email', 'social', 'paid', 'affiliate', 'other'])
  channel?: 'seo' | 'email' | 'social' | 'paid' | 'affiliate' | 'other';

  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetFcfa?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmCampaign?: string;
}
