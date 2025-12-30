import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({ tableName: "Users", paranoid: true, underscored: true })
export class User extends Model<User, Partial<User>> {
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
    field: "is_validated",
  })
  isValidated: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "verification_code",
  })
  verificationCode: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "last_seen_at",
  })
  lastSeenAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "deleted_at",
  })
  deletedAt?: Date;

  @Column({ type: "bytea", allowNull: true })
  avatar: Buffer | null;
}
