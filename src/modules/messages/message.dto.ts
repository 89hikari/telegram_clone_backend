import { IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

/**
 * DTO for creating a message
 */
export class MessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsNumber()
  @IsNotEmpty()
  receiverId: number;
}
