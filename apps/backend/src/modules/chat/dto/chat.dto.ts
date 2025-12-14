import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}

export class TypingDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;
}

export class SeenMessageDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;
    
    @IsNotEmpty()
    @IsString()
    messageId: string;
}

export class CreateConversationDto {
    @IsArray()
    @IsString({ each: true })
    participantIds: string[];
}
