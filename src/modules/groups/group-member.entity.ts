import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "../users/user.entity";
import { Group } from "./group.entity";

export type GroupMemberRole = "admin" | "member";

@Table({ tableName: "GroupMembers", paranoid: true, underscored: true })
export class GroupMember extends Model<GroupMember, Partial<GroupMember>> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "group_id",
  })
  groupId: number;

  @BelongsTo(() => Group)
  group: Group;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "user_id",
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.ENUM("admin", "member"),
    allowNull: false,
    defaultValue: "member",
  })
  role: GroupMemberRole;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: "joined_at",
  })
  joinedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "deleted_at",
  })
  deletedAt?: Date;
}
