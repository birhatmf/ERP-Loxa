import { IRepository } from '@shared/types/repository.interface';
import { Material } from '../entities/material.entity';

/**
 * Repository interface for Material aggregate.
 */
export interface IMaterialRepository extends IRepository<Material> {
  findByName(name: string): Promise<Material | null>;
  findLowStock(): Promise<Material[]>;
}
