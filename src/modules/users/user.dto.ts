export class UserDto {
  readonly id?: number;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly gender: string;
  readonly isValidated?: boolean;
  readonly verificationCode?: string;
  readonly lastSeenAt?: Date;
  readonly createdAt?: Date;
  readonly avatar?: Buffer | null;
}

export type UserInsensitiveDTO = Omit<UserDto, "password" | "verificationCode">;
