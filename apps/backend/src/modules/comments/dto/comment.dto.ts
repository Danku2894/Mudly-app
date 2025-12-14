import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    content: string;

    @IsString()
    postId: string;
}

export class GetCommentsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;
}

export class CommentReactionDto {
    @IsEnum(['LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY'])
    type: 'LIKE' | 'LOVE' | 'LAUGH' | 'SAD' | 'ANGRY';
}
