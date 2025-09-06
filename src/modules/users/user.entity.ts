import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table
export class User extends Model<User> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.ENUM,
    values: ["male", "female"],
    allowNull: false,
  })
  gender: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  is_validated: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  verification_code: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastSeenAt: Date;

  @Column({ type: "bytea", allowNull: true })
  avatar: Buffer | null;
}
