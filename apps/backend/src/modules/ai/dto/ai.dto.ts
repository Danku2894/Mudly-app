import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ToxicDetectDto {
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class SentimentDto {
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class RewriteDto {
    @IsNotEmpty()
    @IsString()
    text: string;
}
