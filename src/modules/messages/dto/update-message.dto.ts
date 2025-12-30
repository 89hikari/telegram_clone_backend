import { IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * DTO for updating an existing message
 */
export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;
}
