import { IsNotEmpty, IsNumber } from "class-validator";

export class AddGroupMemberDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
