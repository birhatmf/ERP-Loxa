import { Knex } from 'knex';
import { User, UserRole } from '@domains/auth/entities/user.entity';
import { IUserRepository } from '@domains/auth/repositories/user.repository';

export class SqliteUserRepository implements IUserRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.knex('users').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.knex('users').where({ username: username.toLowerCase() }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.knex('users').orderBy('created_at', 'desc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async save(entity: User): Promise<void> {
    const existing = await this.knex('users').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('users').where({ id: entity.id }).update(row);
    } else {
      await this.knex('users').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('users').where({ id }).delete();
  }

  private toDomain(row: any): User {
    return User.reconstitute({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role as UserRole,
      isActive: Boolean(row.is_active),
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: User): Record<string, any> {
    return {
      id: entity.id,
      username: entity.username,
      password_hash: (entity as any)._passwordHash,
      name: entity.name,
      role: entity.role,
      is_active: entity.isActive ? 1 : 0,
      last_login: entity.lastLogin?.toISOString() ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
