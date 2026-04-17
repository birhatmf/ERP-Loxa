import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findByType(type: string): Promise<Category[]>;
  save(entity: Category): Promise<void>;
  delete(id: string): Promise<void>;
}
