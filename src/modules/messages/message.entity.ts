import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "../users/user.entity";

@Table({ tableName: "Messages", paranoid: true, underscored: true })
export class Message extends Model<Message, Partial<Message>> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  message: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "sender_id",
  })
  senderId: number;

  @BelongsTo(() => User)
  sender: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "receiver_id",
  })
  receiverId: number;

  @BelongsTo(() => User)
  receiver: User;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "deleted_at",
  })
  deletedAt?: Date;
}
