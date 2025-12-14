import { IsOptional, IsString, IsUrl, IsInt, Min } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  name?: string; // If we add name later
}

export class BehaviorUpdateDto {
    @IsString()
    userId: string;
    
    @IsInt()
    pointsDelta: number; // Can be negative

    @IsOptional()
    @IsString()
    reason?: string;
}
