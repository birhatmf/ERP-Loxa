import { AggregateRoot } from '../types/aggregate-root.base';

/**
 * Generic repository interface for aggregate roots.
 */
export interface IRepository<T extends AggregateRoot> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
