export class UserDto {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly gender: string;
  readonly is_validated?: boolean;
  readonly verification_code?: string;
}

export type UserInsensitiveDTO = Omit<UserDto, "password" | "verification_code" | "is_validated">;
