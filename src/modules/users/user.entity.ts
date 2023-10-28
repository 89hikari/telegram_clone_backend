import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

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
        values: ['male', 'female'],
        allowNull: false,
    })
    gender: string;
}