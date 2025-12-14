import { IsEnum, IsOptional, IsString, IsArray, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostTopic } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsEnum(PostTopic)
  topic?: PostTopic;
}

export class CreateCommentDto {
    @IsString()
    content: string;
    
    @IsString()
    postId: string;
}

export class GetFeedDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: 'time' | 'interaction'; // 'time' (default) or 'interaction'

    @IsOptional()
    @IsEnum(PostTopic)
    topic?: PostTopic;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    zenMode?: boolean; // If true, filter out toxic posts
}

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsEnum(PostTopic)
    topic?: PostTopic;
}

export class ReactionDto {
    @IsEnum(['LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY'])
    type: 'LIKE' | 'LOVE' | 'LAUGH' | 'SAD' | 'ANGRY';
}

