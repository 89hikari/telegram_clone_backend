import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { User } from "../users/user.entity";
import { GroupMember } from "./group-member.entity";
import { GroupMessage } from "./group-message.entity";

@Table({ tableName: "Groups", paranoid: true, underscored: true })
export class Group extends Model<Group, Partial<Group>> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  name: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "owner_id",
  })
  ownerId: number;

  @BelongsTo(() => User)
  owner: User;

  @HasMany(() => GroupMember)
  members: GroupMember[];

  @HasMany(() => GroupMessage)
  messages: GroupMessage[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "deleted_at",
  })
  deletedAt?: Date;
}
