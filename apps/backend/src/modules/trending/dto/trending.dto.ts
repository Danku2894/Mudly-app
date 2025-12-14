import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateHashtagDto {
    @IsNotEmpty()
    @IsString()
    content: string;
}
