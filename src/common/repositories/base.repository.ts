import { Attributes, CreationAttributes, DestroyOptions, FindOptions, UpdateOptions } from "sequelize";
import { Model, Repository } from "sequelize-typescript";

export abstract class BaseRepository<T extends Model> {
  protected constructor(private readonly repository: Repository<T>) {}

  async create(values: CreationAttributes<T>): Promise<T> {
    return this.repository.create(values);
  }

  async findOne(options?: FindOptions<Attributes<T>>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findAll(options?: FindOptions<Attributes<T>>): Promise<T[]> {
    return this.repository.findAll(options);
  }

  async update(values: Partial<Attributes<T>>, options: UpdateOptions<Attributes<T>>): Promise<[number]> {
    return this.repository.update(values, options);
  }

  async destroy(options: DestroyOptions<Attributes<T>>): Promise<number> {
    return this.repository.destroy(options);
  }

  protected getModel(): Repository<T> {
    return this.repository;
  }
}
