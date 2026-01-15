import { IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class GroupMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsNumber()
  @IsOptional()
  groupId?: number;
}
