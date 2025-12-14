import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum NotificationType {
    NEW_MESSAGE = 'NEW_MESSAGE',
    NEW_COMMENT = 'NEW_COMMENT',
    NEW_REACTION = 'NEW_REACTION',
    MENTION = 'MENTION',
    AI_WARNING = 'AI_WARNING',
    SYSTEM = 'SYSTEM'
}

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsEnum(NotificationType)
    type: NotificationType;
    
    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsObject()
    metadata?: any;
}
