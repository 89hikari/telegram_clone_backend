import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from '../users/user.entity';

@Table
export class Message extends Model<Message> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  message: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  senderId: number;

  @BelongsTo(() => User)
  sender: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  receiverId: number;

  @BelongsTo(() => User)
  receiver: User;
}
