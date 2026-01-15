import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "../users/user.entity";
import { Group } from "./group.entity";

@Table({ tableName: "GroupMessages", paranoid: true, underscored: true })
export class GroupMessage extends Model<GroupMessage, Partial<GroupMessage>> {
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
    field: "sender_id",
  })
  senderId: number;

  @BelongsTo(() => User)
  sender: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  message: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "deleted_at",
  })
  deletedAt?: Date;
}
