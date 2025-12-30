import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * DTO for user signup request
 */
export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(["male", "female"])
  @IsNotEmpty()
  gender: string;
}

/**
 * DTO for user login request
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO for email verification
 */
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  vfCode: string;
}
