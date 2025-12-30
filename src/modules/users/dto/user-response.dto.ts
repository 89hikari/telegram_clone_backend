import { UserDto } from "../user.dto";

export type UserResponseDto = Omit<UserDto, "password" | "verificationCode">;
