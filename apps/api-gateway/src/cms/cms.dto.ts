import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MaxLength(220)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  bodyHtml!: string;

  @IsOptional()
  @IsIn(['draft', 'in_review', 'scheduled', 'published', 'unpublished', 'archived'])
  status: 'draft' | 'in_review' | 'scheduled' | 'published' | 'unpublished' | 'archived' = 'draft';

  @IsOptional()
  @IsISO8601()
  publishAt?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  coverMediaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  seoDescription?: string;

  @IsOptional() @IsString() @MaxLength(160)
  author?: string;

  @IsOptional() @IsString() @MaxLength(500)
  canonicalUrl?: string;

  @IsOptional() @IsString()
  ogImageMediaId?: string;

  @IsOptional() @IsBoolean()
  seoIndex = true;

  @IsOptional() @IsArray() @IsString({ each: true })
  galleryMediaIds: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds: string[] = [];
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsIn(['draft', 'in_review', 'scheduled', 'published', 'unpublished', 'archived'])
  status?: 'draft' | 'in_review' | 'scheduled' | 'published' | 'unpublished' | 'archived';

  @IsOptional()
  @IsISO8601()
  publishAt?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  coverMediaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional() @IsString() @MaxLength(160)
  author?: string;

  @IsOptional() @IsString() @MaxLength(500)
  canonicalUrl?: string;

  @IsOptional() @IsString()
  ogImageMediaId?: string;

  @IsOptional() @IsBoolean()
  seoIndex?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  galleryMediaIds?: string[];
}

export class CreateTaxonomyDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFaqDto {
  @IsString()
  @MaxLength(300)
  question!: string;

  @IsString()
  answerHtml!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'unpublished'])
  status: 'draft' | 'published' | 'unpublished' = 'draft';

  @IsOptional()
  @IsInt()
  @Min(0)
  sequence = 10;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  question?: string;

  @IsOptional()
  @IsString()
  answerHtml?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['draft', 'published', 'unpublished'])
  status?: 'draft' | 'published' | 'unpublished';

  @IsOptional()
  @IsInt()
  @Min(0)
  sequence?: number;
}

export class MediaMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;
}

export class SetActiveDto {
  @IsBoolean()
  active!: boolean;
}
