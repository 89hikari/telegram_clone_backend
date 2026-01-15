import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  memberIds?: number[];
}
